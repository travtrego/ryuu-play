import {
  CoinFlipPrompt,
  Effect,
  GameMessage,
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
  let currentPlayer = player;
  let flipResult = true;

  // The player flips first; on heads the other player flips, and so on.
  // Whoever flips tails damages his or her own Active Pokémon.
  for (;;) {
    yield store.prompt(state, new CoinFlipPrompt(currentPlayer.id, GameMessage.COIN_FLIP), result => {
      flipResult = result;
      next();
    });
    if (!flipResult) {
      break;
    }
    currentPlayer = currentPlayer === player ? opponent : player;
  }

  currentPlayer.active.damage += 10;
  return state;
}

export class Digger extends TrainerCard {
  public trainerType: TrainerType = TrainerType.ITEM;

  public set: string = 'TR';

  public name: string = 'Digger';

  public fullName: string = 'Digger TR';

  public text: string =
    'Flip a coin. If tails, do 10 damage to your Active Pokémon. If heads, your opponent flips a coin. If tails, ' +
    'your opponent does 10 damage to his or her Active Pokémon. If heads, you flip a coin. Keep doing this until a ' +
    'player gets tails.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    return state;
  }
}
