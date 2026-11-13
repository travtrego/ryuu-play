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

export class TapuBulu extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.GRASS];

  public hp: number = 140;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Wood Hammer',
      cost: [CardType.GRASS, CardType.GRASS, CardType.COLORLESS, CardType.COLORLESS],
      damage: '220',
      text: 'This Pokémon also does 30 damage to itself.',
    },
  ];

  public set: string = 'SFA';

  public name: string = 'Tapu Bulu';

  public fullName: string = 'Tapu Bulu SFA';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const selfDamage = new DealDamageEffect(effect, 30);
      selfDamage.target = effect.player.active;
      store.reduceEffect(state, selfDamage);
    }
    return state;
  }
}
