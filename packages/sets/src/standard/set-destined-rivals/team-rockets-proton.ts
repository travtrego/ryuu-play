import {
  Card,
  CardList,
  ChooseCardsPrompt,
  Effect,
  GameError,
  GameMessage,
  PokemonCard,
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
import { isTeamRocketsPokemon } from './team-rocket-utils';

function* playCard(
  next: Function,
  store: StoreLike,
  state: State,
  effect: TrainerEffect
): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);
  const eligible = player.deck.cards.filter(card =>
    card instanceof PokemonCard
      && card.stage === Stage.BASIC
      && isTeamRocketsPokemon(card)
  );
  let cards: Card[] = [];

  if (player.deck.cards.length === 0) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  // Searching a deck is hidden-information work, so Proton may legally find
  // zero matching cards. If none are implemented/present, still shuffle.
  if (eligible.length === 0) {
    return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
      player.deck.applyOrder(order);
    });
  }

  const searchPool = new CardList();
  searchPool.cards = eligible;

  yield store.prompt(
    state,
    new ChooseCardsPrompt(
      player.id,
      GameMessage.CHOOSE_CARD_TO_HAND,
      searchPool,
      {},
      { min: 0, max: Math.min(3, eligible.length), allowCancel: true }
    ),
    selected => {
      cards = selected || [];
      next();
    }
  );

  if (cards.length > 0) {
    yield store.prompt(
      state,
      new ShowCardsPrompt(opponent.id, GameMessage.CARDS_SHOWED_BY_THE_OPPONENT, cards),
      () => next()
    );
  }

  player.deck.moveCardsTo(cards, player.hand);

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

export class TeamRocketsProton extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public set: string = 'DRI';

  public name: string = 'Team Rocket\'s Proton';

  public fullName: string = 'Team Rocket\'s Proton DRI';

  public canUseOnFirstTurn: boolean = true;

  public text: string =
    'If you go first, you may use this card during your first turn. ' +
    'Search your deck for up to 3 Basic Team Rocket\'s Pokémon, reveal them, and put them into your hand. ' +
    'Then, shuffle your deck.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    return state;
  }
}
