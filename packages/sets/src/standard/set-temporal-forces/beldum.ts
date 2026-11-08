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

export class Beldum extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.METAL];

  public hp: number = 70;

  public weakness = [{ type: CardType.FIRE }];

  public resistance = [{ type: CardType.GRASS, value: -30 }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    { name: 'Dig Claws', cost: [CardType.METAL], damage: '10', text: '' },
    {
      name: 'Iron Tackle',
      cost: [CardType.METAL, CardType.COLORLESS, CardType.COLORLESS],
      damage: '50',
      text: 'This Pokémon also does 10 damage to itself.',
    },
  ];

  public set: string = 'TEF';

  public name: string = 'Beldum';

  public fullName: string = 'Beldum TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      const selfDamage = new DealDamageEffect(effect, 10);
      selfDamage.target = effect.player.active;
      store.reduceEffect(state, selfDamage);
    }
    return state;
  }
}
