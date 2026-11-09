import {
  AttackEffect,
  CardTag,
  CardType,
  CheckRetreatCostEffect,
  Effect,
  GameError,
  GameMessage,
  PlayerType,
  PokemonCard,
  PowerEffect,
  PowerType,
  Stage,
  State,
  StoreLike,
  UseAttackEffect,
} from '@ptcg/common';
import { commonMarkers } from '../../common';

export class LatiasEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX];

  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.PSYCHIC];

  public hp: number = 210;

  public weakness = [{ type: CardType.DARK }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public powers = [
    {
      name: 'Skyliner',
      powerType: PowerType.ABILITY,
      text: 'Your Basic Pokémon in play have no Retreat Cost.',
    },
  ];

  public attacks = [
    {
      name: 'Eon Blade',
      cost: [CardType.PSYCHIC, CardType.PSYCHIC, CardType.COLORLESS],
      damage: '200',
      text: 'During your next turn, this Pokémon can\'t attack.',
    },
  ];

  public set: string = 'SSP';

  public name: string = 'Latias ex';

  public fullName: string = 'Latias ex SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    const yourNextTurn = commonMarkers.duringYourNextTurn(this, store, state, effect);

    if (effect instanceof UseAttackEffect && yourNextTurn.hasMarker(effect)) {
      throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
    }

    if (effect instanceof CheckRetreatCostEffect) {
      const player = effect.player;
      let inPlay = false;
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (slot, card) => {
        if (card === this) {
          inPlay = true;
        }
      });
      if (!inPlay || !player.active.isBasic()) {
        return state;
      }
      // Something (an opponent's Ability lock) may block Skyliner.
      try {
        store.reduceEffect(state, new PowerEffect(player, this.powers[0], this));
      } catch {
        return state;
      }
      effect.cost = [];
      return state;
    }

    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      // A passive Ability: only checked (see above), never used.
      return state;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      yourNextTurn.setMarker(effect);
    }

    return state;
  }
}
