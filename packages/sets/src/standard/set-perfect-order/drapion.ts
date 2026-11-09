import {
  AddSpecialConditionsEffect,
  AttackEffect,
  CardType,
  DealDamageEffect,
  Effect,
  PokemonCard,
  SpecialCondition,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

export class Drapion extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom: string = 'Skorupi';

  public cardTypes: CardType[] = [CardType.DARK];

  public hp: number = 140;

  public weakness = [{ type: CardType.FIGHTING }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Wrack Down',
      cost: [CardType.DARK, CardType.DARK],
      damage: '60',
      text: '',
    },
    {
      name: 'Hazardous Tail',
      cost: [CardType.DARK, CardType.DARK, CardType.DARK],
      damage: '100',
      text: 'This Pokémon also does 70 damage to itself. Your opponent\'s Active Pokémon is now Paralyzed ' +
        'and Poisoned.',
    },
  ];

  public set: string = 'POR';

  public name: string = 'Drapion';

  public fullName: string = 'Drapion POR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      // "This Pokémon" is the attacker (Slowking can copy this attack).
      const selfDamage = new DealDamageEffect(effect, 70);
      selfDamage.target = effect.player.active;
      store.reduceEffect(state, selfDamage);

      const conditions = new AddSpecialConditionsEffect(effect,
        [SpecialCondition.PARALYZED, SpecialCondition.POISONED]);
      store.reduceEffect(state, conditions);
    }
    return state;
  }
}
