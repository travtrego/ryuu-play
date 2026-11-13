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

export class RioluPRE extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.FIGHTING];

  public hp: number = 70;

  public weakness = [{ type: CardType.PSYCHIC }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Quick Attack',
      cost: [CardType.FIGHTING],
      damage: '10+',
      text: 'Flip a coin. If heads, this attack does 20 more damage.',
    },
  ];

  public set: string = 'PRE';

  public name: string = 'Riolu';

  public fullName: string = 'Riolu PRE';

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
