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

/** Cacnea — Delta Reign 4. */
export class CacneaDLR extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.GRASS];

  public hp: number = 70;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Knock Away',
      cost: [CardType.COLORLESS],
      damage: '10+',
      text: 'Flip a coin. If heads, this attack does 10 more damage.',
    },
  ];

  public set: string = 'DLR';

  public name: string = 'Cacnea';

  public fullName: string = 'Cacnea DLR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      return store.prompt(state, new CoinFlipPrompt(effect.player.id, GameMessage.COIN_FLIP), heads => {
        if (heads) {
          effect.damage += 10;
        }
      });
    }
    return state;
  }
}
