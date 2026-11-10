import {
  AttackEffect,
  CardType,
  DealDamageEffect,
  Effect,
  PokemonCard,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

export class Rellor extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.GRASS];

  public hp: number = 50;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Slight Intrusion',
      cost: [CardType.COLORLESS],
      damage: '30',
      text: 'This Pokémon also does 10 damage to itself.',
    },
  ];

  public set: string = 'TEF';

  public name: string = 'Rellor';

  public fullName: string = 'Rellor TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const selfDamage = new DealDamageEffect(effect, 10);
      selfDamage.target = effect.player.active;
      store.reduceEffect(state, selfDamage);
    }
    return state;
  }
}
