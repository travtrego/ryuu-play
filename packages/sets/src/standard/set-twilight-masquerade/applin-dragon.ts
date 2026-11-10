import {
  AttackEffect,
  Card,
  CardType,
  ChooseCardsPrompt,
  Effect,
  GameMessage,
  PokemonCard,
  ShowCardsPrompt,
  ShuffleDeckPrompt,
  Stage,
  State,
  StateUtils,
  StoreLike,
  SuperType,
} from '@ptcg/common';

function* findAFriend(next: Function, store: StoreLike, state: State, effect: AttackEffect): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);
  if (player.deck.cards.length === 0) {
    return state;
  }

  let found: Card[] = [];
  yield store.prompt(state, new ChooseCardsPrompt(
    player.id,
    GameMessage.CHOOSE_CARD_TO_HAND,
    player.deck,
    { superType: SuperType.POKEMON },
    { min: 0, max: 1, allowCancel: false }
  ), selected => {
    found = selected || [];
    next();
  });

  player.deck.moveCardsTo(found, player.hand);

  if (found.length > 0) {
    yield store.prompt(state, new ShowCardsPrompt(opponent.id, GameMessage.CARDS_SHOWED_BY_THE_OPPONENT, found),
      () => next());
  }

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

/** Applin TWM 126, the Dragon-type Applin (the Grass one is TWM 17). */
export class ApplinDragon extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.DRAGON];

  public hp: number = 40;

  public weakness = [];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Find a Friend',
      cost: [CardType.COLORLESS],
      damage: '',
      text: 'Search your deck for a Pokémon, reveal it, and put it into your hand. Then, shuffle your deck.',
    },
    {
      name: 'Rolling Tackle',
      cost: [CardType.GRASS, CardType.FIRE],
      damage: '30',
      text: '',
    },
  ];

  public set: string = 'TWM';

  public name: string = 'Applin';

  public fullName: string = 'Applin TWM 126';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const generator = findAFriend(() => generator.next(), store, state, effect);
      return generator.next().value;
    }
    return state;
  }
}
