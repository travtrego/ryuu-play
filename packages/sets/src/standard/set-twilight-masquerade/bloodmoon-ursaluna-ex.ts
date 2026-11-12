import {
  AttackEffect,
  CardTag,
  CardType,
  CheckAttackCostEffect,
  Effect,
  GameError,
  GameMessage,
  PokemonCard,
  PowerEffect,
  PowerType,
  Stage,
  State,
  StateUtils,
  StoreLike,
  UseAttackEffect,
} from '@ptcg/common';
import { commonMarkers } from '../../common';

export class BloodmoonUrsalunaEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX];

  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.COLORLESS];

  public hp: number = 260;

  public weakness = [{ type: CardType.FIGHTING }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS];

  public powers = [
    {
      name: 'Seasoned Skill',
      powerType: PowerType.ABILITY,
      text: 'Blood Moon used by this Pokémon costs C less for each Prize card your opponent has taken.',
    },
  ];

  public attacks = [
    {
      name: 'Blood Moon',
      cost: [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
      damage: '240',
      text: 'During your next turn, this Pokémon can\'t attack.',
    },
  ];

  public set: string = 'TWM';

  public name: string = 'Bloodmoon Ursaluna ex';

  public fullName: string = 'Bloodmoon Ursaluna ex TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    const yourNextTurn = commonMarkers.duringYourNextTurn(this, store, state, effect);

    if (effect instanceof UseAttackEffect && yourNextTurn.hasMarker(effect)) {
      throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
    }

    if (effect instanceof CheckAttackCostEffect
      && effect.attack === this.attacks[0]
      && effect.player.active.getPokemonCard() === this) {
      const opponent = StateUtils.getOpponent(state, effect.player);
      const taken = Math.max(0, 6 - opponent.getPrizeLeft());
      if (taken === 0) {
        return state;
      }
      // Something (an opponent's Ability lock) may block Seasoned Skill.
      try {
        store.reduceEffect(state, new PowerEffect(effect.player, this.powers[0], this));
      } catch {
        return state;
      }
      for (let i = 0; i < taken; i++) {
        const index = effect.cost.lastIndexOf(CardType.COLORLESS);
        if (index === -1) {
          break;
        }
        effect.cost.splice(index, 1);
      }
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
