import {
  AbstractAttackEffect,
  AfterDamageEffect,
  ApplyWeaknessEffect,
  AttackEffect,
  CardTag,
  CardType,
  DealDamageEffect,
  Effect,
  PokemonCard,
  PowerEffect,
  PowerType,
  PutDamageEffect,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

import { commonMarkers } from '../../common';

export class EmpoleonEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX];

  public stage: Stage = Stage.STAGE_2;

  public evolvesFrom = 'Prinplup';

  public cardTypes: CardType[] = [CardType.METAL];

  public hp: number = 320;

  public weakness = [{ type: CardType.FIRE }];

  public resistance = [{ type: CardType.GRASS, value: -30 }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public powers = [
    {
      name: 'Emperor\'s Stance',
      powerType: PowerType.ABILITY,
      text: 'Prevent all effects of attacks used by your opponent\'s Pokémon done to this Pokémon. ' +
        '(Damage is not an effect.)',
    },
  ];

  public attacks = [
    {
      name: 'Iron Feathers',
      cost: [CardType.METAL, CardType.METAL, CardType.COLORLESS],
      damage: '210',
      text: 'During your opponent\'s next turn, this Pokémon takes 60 less damage from attacks (after applying ' +
        'Weakness and Resistance).',
    },
  ];

  public set: string = 'PFL';

  public name: string = 'Empoleon ex';

  public fullName: string = 'Empoleon ex PFL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    const opponentNextTurn = commonMarkers.duringOpponentNextTurn(this, store, state, effect);

    if (effect instanceof PutDamageEffect
      && effect.target.getPokemonCard() === this
      && opponentNextTurn.hasMarker(effect, effect.target)) {
      effect.damage = Math.max(0, effect.damage - 60);
      return state;
    }

    // Emperor's Stance: same shape as Mist Energy, for this Pokémon only.
    if (effect instanceof AbstractAttackEffect
      && effect.target.getPokemonCard() === this
      && !(effect instanceof DealDamageEffect)
      && !(effect instanceof PutDamageEffect)
      && !(effect instanceof ApplyWeaknessEffect)
      && !(effect instanceof AfterDamageEffect)
      && StateUtils.findOwner(state, effect.target) !== effect.player) {
      const owner = StateUtils.findOwner(state, effect.target);
      try {
        store.reduceEffect(state, new PowerEffect(owner, this.powers[0], this));
      } catch {
        return state;
      }
      effect.preventDefault = true;
      return state;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      opponentNextTurn.setMarker(effect, effect.player.active);
    }

    return state;
  }
}
