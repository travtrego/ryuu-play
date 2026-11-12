import {
  Card,
  ChooseCardsPrompt,
  Effect,
  GameError,
  GameMessage,
  PokemonCard,
  State,
  StateUtils,
  StoreLike,
  SuperType,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

function* playCard(next: Function, store: StoreLike, state: State, effect: TrainerEffect): IterableIterator<State> {
  const player = effect.player;

  // Only Pokémon without a Rule Box can be discarded.
  const blocked: number[] = [];
  let eligible = 0;
  player.hand.cards.forEach((card, index) => {
    if (card instanceof PokemonCard && !StateUtils.hasRuleBox(card)) {
      eligible += 1;
    } else {
      blocked.push(index);
    }
  });
  // "Up to 2": with none to discard the card would do nothing, so it can't be played.
  if (eligible === 0) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  let cards: Card[] = [];
  yield store.prompt(state, new ChooseCardsPrompt(
    player.id,
    GameMessage.CHOOSE_CARD_TO_DISCARD,
    player.hand,
    { superType: SuperType.POKEMON },
    { min: 1, max: Math.min(2, eligible), allowCancel: true, blocked }
  ), selected => {
    cards = selected || [];
    next();
  });

  if (cards.length === 0) {
    return state;
  }

  player.hand.moveCardsTo(cards, player.discard);
  player.deck.moveTo(player.hand, 3 * cards.length);
  return state;
}

export class Gwynn extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public set: string = 'PBL';

  public name: string = 'Gwynn';

  public fullName: string = 'Gwynn PBL';

  public text: string =
    'Discard up to 2 Pokémon that don\'t have a Rule Box from your hand, and draw 3 cards for each card you ' +
    'discarded in this way. (Pokémon ex, Pokémon V, etc. have Rule Boxes.)';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }
    return state;
  }
}
