import { Action, Player, State, EnergyCard, PlayCardAction, CardTarget,
  PlayerType, Card, Attack } from '@ptcg/common';
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
    const target = targets[0].target;
    const index = player.hand.cards.indexOf(targets[0].card);
    return new PlayCardAction(player.id, index, target); 
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
    return `${head} ${reason}. You can attach one Energy per turn.${where}`;
  }

}
