import {
  Card,
  ChooseCardsPrompt,
  Effect,
  GameError,
  GameMessage,
  ShowCardsPrompt,
  ShuffleDeckPrompt,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerType,
  UseStadiumEffect,
} from '@ptcg/common';
import { isMarniesPokemon } from './marnie-utils';

function* useStadium(next: Function, store: StoreLike, state: State, effect: UseStadiumEffect): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);

  const blocked: number[] = [];
  player.deck.cards.forEach((card, index) => {
    if (!isMarniesPokemon(card)) {
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
      { min: 0, max: 1, allowCancel: true, blocked }
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

/** Spikemuth Gym — Destined Rivals 169/182. */
export class SpikemuthGym extends TrainerCard {
  public trainerType: TrainerType = TrainerType.STADIUM;

  public set: string = 'DRI';

  public name: string = 'Spikemuth Gym';

  public fullName: string = 'Spikemuth Gym DRI';

  public text: string =
    'Once during each player\'s turn, that player may search their deck for a Marnie\'s Pokémon, reveal it, ' +
    'and put it into their hand. Then, that player shuffles their deck.';

  public useWhenInPlay = true;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof UseStadiumEffect && StateUtils.getStadiumCard(state) === this) {
      if (effect.player.deck.cards.length === 0) {
        throw new GameError(GameMessage.CANNOT_USE_STADIUM);
      }
      const generator = useStadium(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    return state;
  }
}
