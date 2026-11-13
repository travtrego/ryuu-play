import {
  AttackEffect,
  CardTag,
  CardType,
  DealDamageEffect,
  Effect,
  PokemonCard,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

export class MegaLopunnyEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX, CardTag.MEGA_EVOLUTION_EX];

  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom: string = 'Buneary';

  public cardTypes: CardType[] = [CardType.COLORLESS];

  public hp: number = 330;

  public weakness = [{ type: CardType.FIGHTING }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Gale Thrust',
      cost: [CardType.COLORLESS],
      damage: '60+',
      text: 'If this Pokémon moved from your Bench to the Active Spot this turn, this attack does 170 more damage.',
    },
    {
      name: 'Spiky Hopper',
      cost: [CardType.COLORLESS, CardType.COLORLESS],
      damage: '160',
      text: 'This attack\'s damage isn\'t affected by any effects on your opponent\'s Active Pokémon.',
    },
  ];

  public set: string = 'PFL';

  public name: string = 'Mega Lopunny ex';

  public fullName: string = 'Mega Lopunny ex PFL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      if (effect.player.movedActiveThisTurn) {
        effect.damage += 170;
      }
      return state;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      // Place the damage directly, skipping PutDamageEffect, where effects on
      // the opponent's Active Pokémon live (same approach as N's Zekrom).
      const dealDamage = new DealDamageEffect(effect, effect.damage);
      dealDamage.preventDefault = true;
      store.reduceEffect(state, dealDamage);

      const damage = Math.max(0, dealDamage.damage);
      effect.damage = 0;
      if (damage > 0) {
        effect.opponent.active.damage += damage;
      }
    }

    return state;
  }
}
