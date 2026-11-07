import {
  AfterDamageEffect,
  ApplyWeaknessEffect,
  AttackEffect,
  CardType,
  DealDamageEffect,
  Effect,
  GameError,
  GameMessage,
  PokemonCard,
  Stage,
  State,
  StoreLike,
  UseAttackEffect,
} from '@ptcg/common';
import { commonMarkers } from '../../common';

export class NsZekrom extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.DRAGON];

  public hp: number = 130;

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Shred',
      cost: [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
      damage: '70',
      text: 'This attack\'s damage isn\'t affected by any effects on your opponent\'s Active Pokémon.',
    },
    {
      name: 'Rampaging Thunder',
      cost: [CardType.FIRE, CardType.LIGHTNING, CardType.LIGHTNING, CardType.COLORLESS],
      damage: '250',
      text: 'During your next turn, this Pokémon can\'t use attacks.',
    },
  ];

  public set: string = 'ASC';

  public name: string = 'N\'s Zekrom';

  public fullName: string = 'N\'s Zekrom ASC';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // The marker sits on the attacking Active Pokémon, so it also stops an
    // N's Zoroark ex that used Rampaging Thunder through Night Joker.
    const yourNextTurn = commonMarkers.duringYourNextTurn(this, store, state, effect);

    if (effect instanceof UseAttackEffect && yourNextTurn.hasMarker(effect)) {
      throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      // Same approach as Rayquaza DRV: the attacker's own damage boosts
      // (DealDamageEffect) and Weakness/Resistance apply, but the damage is
      // placed directly, skipping PutDamageEffect, where the effects on the
      // opponent's Active Pokémon (damage reduction, prevention) live.
      const dealDamage = new DealDamageEffect(effect, effect.damage);
      dealDamage.preventDefault = true;
      store.reduceEffect(state, dealDamage);

      const applyWeakness = new ApplyWeaknessEffect(effect, dealDamage.damage);
      store.reduceEffect(state, applyWeakness);
      const damage = Math.max(0, applyWeakness.damage);
      effect.damage = 0;

      if (damage > 0) {
        effect.opponent.active.damage += damage;
        const afterDamage = new AfterDamageEffect(effect, damage);
        store.reduceEffect(state, afterDamage);
      }
      return state;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      yourNextTurn.setMarker(effect);
    }

    return state;
  }
}
