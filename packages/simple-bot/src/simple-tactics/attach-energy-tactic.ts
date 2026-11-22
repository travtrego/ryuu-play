import { Action, Player, State, EnergyCard, PlayCardAction, CardTarget,
  PlayerType, Card, Attack, AttackAction, PassTurnAction, SlotType } from '@ptcg/common';
import { SimpleTactic } from './simple-tactics';
import { EnergyScore } from '../state-score/energy-score';
import { canPay, getOwnSlot, joinList, missingEnergyCount, plural, pokemonName } from '../explain/explain-utils';

export class AttachEnergyTactic extends SimpleTactic {

  public useTactic(state: State, player: Player): Action | undefined {
    if (player.energyPlayedTurn >= state.turn) {
      return undefined;
    }

    // Distinct list with player's energies.
    const energies: EnergyCard[] = [];
    player.hand.cards.forEach(c => {
      if (c instanceof EnergyCard && !energies.some(e => e.fullName === c.fullName)) {
        energies.push(c);
      }
    });

    if (energies.length === 0) {
      return;
    }

    const energyScore = new EnergyScore(this.options);
    const baseScore = energyScore.getScore(state, player.id);
    const targets: { target: CardTarget, card: Card, score: number }[] = [];
    player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (pokemonSlot, pokemon, target) => {

      for (const card of energies) {
        pokemonSlot.energies.cards.push(card);
        const score = energyScore.getScore(state, player.id);
        pokemonSlot.energies.cards.pop();
        if (score > baseScore) {
          targets.push({ target, score, card });
        }
      }
    });

    if (targets.length === 0) {
      return;
    }

    targets.sort((a, b) => b.score - a.score);
    for (const candidate of targets) {
      const index = player.hand.cards.indexOf(candidate.card);
      const action = new PlayCardAction(player.id, index, candidate.target);
      if (this.isWorthAttaching(state, player, action, candidate.card)) {
        return action;
      }
    }
    return undefined;
  }

  /**
   * Most Energy stays attached, so attaching it is always worth it once the
   * EnergyScore likes it. Some Energy is gone when the turn ends (Ignition
   * Energy is discarded at the end of the turn). Attaching that kind is only
   * worth it when it lets the Active Pokémon use an attack this turn that it
   * could not use without it; otherwise the card is simply wasted.
   */
  private isWorthAttaching(state: State, player: Player, action: PlayCardAction, card: Card): boolean {
    const lastsOneTurn = this.lastsOnlyThisTurn(state, player, action, card);
    if (lastsOneTurn === undefined || !lastsOneTurn.oneTurn) {
      return true;
    }
    return this.unlockedAttacks(state, player, action, lastsOneTurn.afterAttach).length > 0;
  }

  /**
   * Simulates the attachment and then the end of the turn, and checks whether
   * the card is still attached to one of the bot's Pokémon afterwards.
   * Undefined when the simulation fails (then the old behaviour is kept).
   */
  private lastsOnlyThisTurn(state: State, player: Player, action: PlayCardAction, card: Card):
    { oneTurn: boolean, afterAttach: State } | undefined {
    const afterAttach = this.simulateAction(state, action);
    if (afterAttach === undefined) {
      return undefined;
    }
    const afterPass = this.simulateAction(afterAttach, new PassTurnAction(player.id));
    const me = afterPass && afterPass.players.find(p => p.id === player.id);
    if (afterPass === undefined || me === undefined) {
      return undefined;
    }
    let kept = false;
    me.forEachPokemon(PlayerType.BOTTOM_PLAYER, slot => {
      if (slot.energies.cards.some(c => c.id === card.id)) {
        kept = true;
      }
    });
    return { oneTurn: !kept, afterAttach };
  }

  /** Attacks of the Active Pokémon the attachment makes usable this turn. */
  private unlockedAttacks(state: State, player: Player, action: PlayCardAction, afterAttach: State): string[] {
    const active = player.active.getPokemonCard();
    if (action.target.slot !== SlotType.ACTIVE || active === undefined) {
      return [];
    }
    return active.attacks
      .filter(a => this.simulateAction(state, new AttackAction(player.id, a.name)) === undefined
        && this.simulateAction(afterAttach, new AttackAction(player.id, a.name)) !== undefined)
      .map(a => a.name);
  }

  public explain(state: State, player: Player, action: Action): string {
    if (!(action instanceof PlayCardAction)) {
      return super.explain(state, player, action);
    }
    const energy = player.hand.cards[action.handIndex];
    const slot = getOwnSlot(player, action.target);
    const pokemon = slot && slot.getPokemonCard();
    if (!(energy instanceof EnergyCard) || slot === undefined || pokemon === undefined) {
      return super.explain(state, player, action);
    }

    const head = `Attached ${energy.name} to ${pokemonName(slot)}`;
    const isActive = slot === player.active;

    // Compare what the Pokémon can pay for before and after the attachment.
    const before = pokemon.attacks.map(a => ({ attack: a, missing: missingEnergyCount(slot, a.cost) }));
    const retreatBefore = canPay(slot, pokemon.retreat);
    let after: { attack: Attack, missing: number }[];
    let retreatAfter: boolean;
    slot.energies.cards.push(energy);
    try {
      after = pokemon.attacks.map(a => ({ attack: a, missing: missingEnergyCount(slot, a.cost) }));
      retreatAfter = canPay(slot, pokemon.retreat);
    } finally {
      slot.energies.cards.pop();
    }

    const unlocked = after
      .filter((a, i) => a.missing === 0 && before[i].missing > 0)
      .map(a => a.attack.name);
    let reason: string;
    if (unlocked.length > 0) {
      reason = isActive
        ? `so it can use ${joinList(unlocked)} this turn`
        : `so it can use ${joinList(unlocked)} once it is the Active Pokémon`;
    } else {
      const closer = after
        .filter((a, i) => a.missing > 0 && a.missing < before[i].missing)
        .sort((a, b) => a.missing - b.missing)[0];
      if (closer !== undefined) {
        reason = `to get closer to ${closer.attack.name} (it still needs ${plural(closer.missing, 'more Energy')})`;
      } else if (retreatAfter && !retreatBefore && pokemon.retreat.length > 0) {
        reason = 'so it has enough Energy to retreat';
      } else {
        reason = 'because that Pokémon needed the Energy most';
      }
    }
    const where = isActive
      ? ''
      : ' The bot prefers to power up its Active Pokémon, but this Benched Pokémon came out ahead.';
    const oneTurn = this.lastsOnlyThisTurn(state, player, action, energy);
    const lasts = oneTurn !== undefined && oneTurn.oneTurn
      ? ` ${energy.name} is gone at the end of the turn, so the bot only attaches it when it lets`
        + ` ${pokemonName(slot)} use ${joinList(this.unlockedAttacks(state, player, action, oneTurn.afterAttach))} right away.`
      : '';
    return `${head} ${reason}. You can attach one Energy per turn.${where}${lasts}`;
  }

}
