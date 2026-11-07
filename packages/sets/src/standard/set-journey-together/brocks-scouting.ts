import {
  Card,
  ChooseCardsPrompt,
  Effect,
  GameError,
  GameMessage,
  PokemonCard,
  SelectPrompt,
  ShowCardsPrompt,
  ShuffleDeckPrompt,
  Stage,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

function* playCard(next: Function, store: StoreLike, state: State, effect: TrainerEffect): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);

  if (player.deck.cards.length === 0) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  // First choose which half of the card to use: 2 Basic Pokémon or 1 Evolution Pokémon.
  let evolution = false;
  yield store.prompt(state, new SelectPrompt(
    player.id,
    GameMessage.CHOOSE_OPTION,
    ['Up to 2 Basic Pokémon', '1 Evolution Pokémon'],
    { allowCancel: false }
  ), choice => {
    evolution = choice === 1;
    next();
  });

  const blocked: number[] = [];
  player.deck.cards.forEach((card, index) => {
    const ok = card instanceof PokemonCard
      && (evolution ? card.stage !== Stage.BASIC : card.stage === Stage.BASIC);
    if (!ok) {
      blocked.push(index);
    }
  });

  let found: Card[] = [];
  yield store.prompt(state, new ChooseCardsPrompt(
    player.id,
    GameMessage.CHOOSE_CARD_TO_HAND,
    player.deck,
    {},
    { min: 0, max: evolution ? 1 : 2, allowCancel: false, blocked }
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

export class BrocksScouting extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public set: string = 'JTG';

  public name: string = 'Brock\'s Scouting';

  public fullName: string = 'Brock\'s Scouting JTG';

  public text: string =
    'Search your deck for up to 2 Basic Pokémon or 1 Evolution Pokémon, reveal them, and put them into your ' +
    'hand. Then, shuffle your deck.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }
    return state;
  }
}
