import {
  AttackEffect,
  CardType,
  ChooseCardsPrompt,
  DiscardCardsEffect,
  Effect,
  EndTurnEffect,
  EnergyType,
  GameError,
  GameMessage,
  PokemonCard,
  PowerEffect,
  PowerType,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

export class Slaking extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;

  public evolvesFrom = 'Vigoroth';

  public cardTypes: CardType[] = [CardType.COLORLESS];

  public hp: number = 120;

  public powers = [
    {
      name: 'Lazy',
      powerType: PowerType.POKEBODY,
      text: 'As long as Slaking is your Active Pokémon, your opponent\'s Pokémon can\'t use any Poké-Powers.',
    },
  ];

  public attacks = [
    {
      name: 'Critical Move',
      cost: [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
      damage: '100',
      text:
        'Discard a basic Energy card attached to Slaking or this attack does nothing. Slaking can\'t attack during ' +
        'your next turn.',
    },
  ];

  public weakness = [{ type: CardType.FIGHTING }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS];

  public set: string = 'RS';

  public name: string = 'Slaking';

  public fullName: string = 'Slaking RS';

  public readonly CRITICAL_MOVE_1_MARKER = 'CRITICAL_MOVE_1_MARKER';

  public readonly CRITICAL_MOVE_2_MARKER = 'CRITICAL_MOVE_2_MARKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect && effect.power.powerType === PowerType.POKEPOWER) {
      const player = effect.player;
      const slakingCardList = StateUtils.findCardList(state, this);
      const slakingPlayer = StateUtils.findOwner(state, slakingCardList);

      // Lazy only affects the opponent's Pokemon
      if (player === slakingPlayer) {
        return state;
      }

      // Not active Pokemon
      if (slakingPlayer.active.pokemons !== slakingCardList) {
        return state;
      }

      // pokemon is evolved
      if (slakingPlayer.active.getPokemonCard() !== this) {
        return state;
      }

      // Try to reduce PowerEffect, to check if something is blocking our ability
      try {
        const powerEffect = new PowerEffect(slakingPlayer, this.powers[0], this);
        store.reduceEffect(state, powerEffect);
      } catch {
        return state;
      }

      throw new GameError(GameMessage.BLOCKED_BY_ABILITY);
    }

    if (effect instanceof EndTurnEffect) {
      const marker = effect.player.active.marker;
      if (marker.hasMarker(this.CRITICAL_MOVE_2_MARKER, this)) {
        marker.removeMarker(this.CRITICAL_MOVE_2_MARKER);
      } else if (marker.hasMarker(this.CRITICAL_MOVE_1_MARKER, this)) {
        marker.removeMarker(this.CRITICAL_MOVE_1_MARKER);
      }
    }

    if (effect instanceof AttackEffect && effect.player.active.marker.hasMarker(this.CRITICAL_MOVE_1_MARKER, this)) {
      throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;

      // "or this attack does nothing" - the attack can still be used, it just
      // does nothing:
      //   Q. "If tails, that attack does nothing". Does this mean that the
      //      attack cannot be made or that the attack can be made but neither
      //      damage nor effects can happen?
      //   A. The attack will be made, but damage and effects don't happen.
      //   (Oct 19, 2000 WotC Chat, Q185)
      //
      // "effects don't happen" covers the drawback too, so Slaking is not
      // locked out of attacking next turn. The markers below are only added
      // once an Energy has actually been discarded.
      if (!player.active.energies.cards.some(c => c.energyType === EnergyType.BASIC)) {
        effect.damage = 0;
        return state;
      }

      return store.prompt(
        state,
        new ChooseCardsPrompt(
          player.id,
          GameMessage.CHOOSE_CARD_TO_DISCARD,
          player.active.energies,
          { energyType: EnergyType.BASIC },
          { min: 1, max: 1, allowCancel: false }
        ),
        cards => {
          cards = cards || [];
          if (cards.length > 0) {
            player.active.marker.addMarker(this.CRITICAL_MOVE_1_MARKER, this);
            player.active.marker.addMarker(this.CRITICAL_MOVE_2_MARKER, this);

            const discardEnergy = new DiscardCardsEffect(effect, cards);
            discardEnergy.target = player.active;
            store.reduceEffect(state, discardEnergy);
          }
        }
      );
    }

    return state;
  }
}
