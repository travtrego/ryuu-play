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

function* useSummoningJutsu(
  next: Function,
  store: StoreLike,
  state: State,
  effect: AttackEffect
): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);

  if (player.deck.cards.length === 0) {
    return state;
  }

  let cards: Card[] = [];
  yield store.prompt(state, new ChooseCardsPrompt(
    player.id,
    GameMessage.CHOOSE_CARD_TO_HAND,
    player.deck,
    { superType: SuperType.POKEMON },
    { min: 0, max: 3, allowCancel: true }
  ), selected => {
    cards = selected || [];
    next();
  });

  if (cards.length > 0) {
    yield store.prompt(state, new ShowCardsPrompt(opponent.id, GameMessage.CARDS_SHOWED_BY_THE_OPPONENT, cards),
      () => next());
  }

  player.deck.moveCardsTo(cards, player.hand);

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

export class FrogadierCRI extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom: string = 'Froakie';

  public cardTypes: CardType[] = [CardType.WATER];

  public hp: number = 100;

  public weakness = [{ type: CardType.LIGHTNING }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Summoning Jutsu',
      cost: [CardType.WATER],
      damage: '',
      text: 'Search your deck for up to 3 Pokémon, reveal them, and put them into your hand. Then, shuffle ' +
        'your deck.',
    },
    { name: 'Aqua Edge', cost: [CardType.WATER, CardType.WATER], damage: '50', text: '' },
  ];

  public set: string = 'CRI';

  public name: string = 'Frogadier';

  public fullName: string = 'Frogadier CRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const generator = useSummoningJutsu(() => generator.next(), store, state, effect);
      return generator.next().value;
    }
    return state;
  }
}
