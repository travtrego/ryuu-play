import {
  AfterDamageEffect,
  AttackEffect,
  CardTag,
  CardType,
  DealDamageEffect,
  Effect,
  PokemonCard,
  SlotType,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';
import { commonAttacks } from '../../common';

export class MegaStarmieEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX, CardTag.MEGA_EVOLUTION_EX];

  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom: string = 'Staryu';

  public cardTypes: CardType[] = [CardType.WATER];

  public hp: number = 330;

  public weakness = [{ type: CardType.LIGHTNING }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Jetting Blow',
      cost: [CardType.WATER],
      damage: '120',
      text: 'This attack also does 50 damage to 1 of your opponent\'s Benched Pokémon. (Don\'t apply Weakness ' +
        'and Resistance for Benched Pokémon.)',
    },
    {
      name: 'Nebula Beam',
      cost: [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
      damage: '210',
      text: 'This attack\'s damage isn\'t affected by Weakness or Resistance, or by any effects on your ' +
        'opponent\'s Active Pokémon.',
    },
  ];

  public set: string = 'POR';

  public name: string = 'Mega Starmie ex';

  public fullName: string = 'Mega Starmie ex POR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const damageOpponentPokemon = commonAttacks.damageOpponentPokemon(this, store, state, effect);
      return damageOpponentPokemon.use(effect, 50, [SlotType.BENCH]);
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      // As N's Zekrom's Shred, without Weakness and Resistance: the
      // attacker's own boosts (DealDamageEffect) apply, then the damage is
      // placed directly, skipping the effects on the opponent's Active.
      const dealDamage = new DealDamageEffect(effect, effect.damage);
      dealDamage.preventDefault = true;
      store.reduceEffect(state, dealDamage);
      const damage = Math.max(0, dealDamage.damage);
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
