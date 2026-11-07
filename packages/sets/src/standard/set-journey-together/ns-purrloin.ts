import {
  AttackEffect,
  CardType,
  ChooseCardsPrompt,
  Effect,
  GameMessage,
  PokemonCard,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

export class NsPurrloin extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.DARK];

  public hp: number = 70;

  public weakness = [{ type: CardType.GRASS }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Thieving Swipe',
      cost: [CardType.DARK, CardType.COLORLESS],
      damage: '30',
      text: 'Your opponent reveals their hand, and you choose a card you find there and put it on the bottom ' +
        'of their deck.',
    },
  ];

  public set: string = 'JTG';

  public name: string = 'N\'s Purrloin';

  public fullName: string = 'N\'s Purrloin JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      const opponent = effect.opponent;
      if (opponent.hand.cards.length === 0) {
        return state;
      }
      // The hand is revealed, so the prompt shows every card in it.
      return store.prompt(state, new ChooseCardsPrompt(
        player.id,
        GameMessage.CHOOSE_CARD_TO_DECK,
        opponent.hand,
        {},
        { min: 1, max: 1, allowCancel: false }
      ), selected => {
        const cards = selected || [];
        opponent.hand.moveCardsTo(cards, opponent.deck);
      });
    }
    return state;
  }
}
