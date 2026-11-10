import {
  AttackEffect,
  CardType,
  CoinFlipPrompt,
  Effect,
  GameMessage,
  PokemonCard,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

export class Applin extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.GRASS];

  public hp: number = 40;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Tumbling Attack',
      cost: [CardType.GRASS],
      damage: '10+',
      text: 'Flip a coin. If heads, this attack does 20 more damage.',
    },
  ];

  public set: string = 'TWM';

  public name: string = 'Applin';

  public fullName: string = 'Applin TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      return store.prompt(state, new CoinFlipPrompt(effect.player.id, GameMessage.COIN_FLIP), heads => {
        if (heads) {
          effect.damage += 20;
        }
      });
    }
    return state;
  }
}
