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
  StoreLike,
  TrainerCard,
  TrainerType,
} from '@ptcg/common';

function* useTraverseTime(next: Function, store: StoreLike, state: State, effect: AttackEffect): IterableIterator<State> {
  const player = effect.player;
  const opponent = effect.opponent;

  if (player.deck.cards.length === 0) {
    return state;
  }

  const blocked: number[] = [];
  player.deck.cards.forEach((card, index) => {
    if (!isGrassPokemonOrStadium(card)) {
      blocked.push(index);
    }
  });

  let cards: Card[] = [];
  if (blocked.length < player.deck.cards.length) {
    yield store.prompt(state, new ChooseCardsPrompt(
      player.id,
      GameMessage.CHOOSE_CARD_TO_HAND,
      player.deck,
      {},
      { min: 0, max: 3, allowCancel: true, blocked }
    ), selected => {
      cards = selected || [];
      next();
    });
  }

  if (cards.length > 0) {
    yield store.prompt(state, new ShowCardsPrompt(opponent.id, GameMessage.CARDS_SHOWED_BY_THE_OPPONENT, cards),
      () => next());
    player.deck.moveCardsTo(cards, player.hand);
  }

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

function isGrassPokemonOrStadium(card: Card): boolean {
  if (card instanceof PokemonCard) {
    return card.cardTypes.includes(CardType.GRASS);
  }
  return card instanceof TrainerCard && card.trainerType === TrainerType.STADIUM;
}

export class CelebiMEG extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.GRASS];

  public hp: number = 80;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Traverse Time',
      cost: [CardType.GRASS],
      damage: '',
      text: 'Search your deck for up to 3 in any combination of G Pokémon and Stadium cards, reveal them, and ' +
        'put them into your hand. Then, shuffle your deck.',
    },
    {
      name: 'Solar Cutter',
      cost: [CardType.GRASS],
      damage: '30',
      text: '',
    },
  ];

  public set: string = 'MEG';

  public name: string = 'Celebi';

  public fullName: string = 'Celebi MEG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const generator = useTraverseTime(() => generator.next(), store, state, effect);
      return generator.next().value;
    }
    return state;
  }
}
