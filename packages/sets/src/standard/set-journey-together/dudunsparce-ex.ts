import {
  AfterDamageEffect,
  ApplyWeaknessEffect,
  AttackEffect,
  CardTag,
  CardType,
  DealDamageEffect,
  Effect,
  PlayerType,
  PokemonCard,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

export class DudunsparceEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX];

  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom: string = 'Dunsparce';

  public cardTypes: CardType[] = [CardType.COLORLESS];

  public hp: number = 270;

  public weakness = [{ type: CardType.FIGHTING }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Tenacious Tail',
      cost: [CardType.COLORLESS],
      damage: '60×',
      text: 'This attack does 60 damage for each of your opponent\'s Pokémon ex in play.',
    },
    {
      name: 'Destructive Drill',
      cost: [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
      damage: '150',
      text: 'This attack\'s damage isn\'t affected by any effects on your opponent\'s Active Pokémon.',
    },
  ];

  public set: string = 'JTG';

  public name: string = 'Dudunsparce ex';

  public fullName: string = 'Dudunsparce ex JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      let count = 0;
      effect.opponent.forEachPokemon(PlayerType.TOP_PLAYER, (_slot, card) => {
        if (card.tags.includes(CardTag.POKEMON_EX)) {
          count += 1;
        }
      });
      effect.damage = 60 * count;
      return state;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      // Same approach as N's Zekrom / Rayquaza DRV: the attacker's own damage
      // boosts (DealDamageEffect) and Weakness/Resistance apply, but the damage
      // is placed directly, skipping PutDamageEffect, where the effects on the
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
    }

    return state;
  }
}
