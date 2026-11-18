import {
  AttackEffect,
  CardType,
  Effect,
  PokemonCard,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

export class CynthiasGible extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.FIGHTING];

  public hp: number = 70;

  public weakness = [{ type: CardType.GRASS }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Rock Hurl',
      cost: [CardType.FIGHTING],
      damage: '20',
      text: 'This attack\'s damage isn\'t affected by Resistance.',
    },
  ];

  public set: string = 'DRI';

  public name: string = 'Cynthia\'s Gible';

  public fullName: string = 'Cynthia\'s Gible DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      effect.ignoreResistance = true;
    }
    return state;
  }
}
