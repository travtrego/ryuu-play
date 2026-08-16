import {
  CardTarget,
  ChoosePokemonPrompt,
  Effect,
  GameError,
  GameMessage,
  PlayerType,
  SlotType,
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
  const activeCard = player.active.getPokemonCard();
  const validBenchIndexes = player.bench
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => slot.pokemons.cards.length > 0 && isTeamRocketsPokemon(slot.getPokemonCard()))
    .map(({ index }) => index);

  if (!isTeamRocketsPokemon(activeCard)
      || validBenchIndexes.length === 0
      || !opponent.bench.some(slot => slot.pokemons.cards.length > 0)) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  const blocked: CardTarget[] = player.bench
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot, index }) => slot.pokemons.cards.length > 0 && !validBenchIndexes.includes(index))
    .map(({ index }) => ({
      player: PlayerType.BOTTOM_PLAYER,
      slot: SlotType.BENCH,
      index,
    }));

  yield store.prompt(
    state,
    new ChoosePokemonPrompt(
      player.id,
      GameMessage.CHOOSE_POKEMON_TO_SWITCH,
      PlayerType.BOTTOM_PLAYER,
      [SlotType.BENCH],
      { allowCancel: false, blocked }
    ),
    result => {
      player.switchPokemon(result[0]);
      next();
    }
  );

  return store.prompt(
    state,
    new ChoosePokemonPrompt(
      player.id,
      GameMessage.CHOOSE_POKEMON_TO_SWITCH,
      PlayerType.TOP_PLAYER,
      [SlotType.BENCH],
      { allowCancel: false }
    ),
    result => {
      opponent.switchPokemon(result[0]);
    }
  );
}

export class TeamRocketsGiovanni extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public set: string = 'DRI';

  public name: string = 'Team Rocket\'s Giovanni';

  public fullName: string = 'Team Rocket\'s Giovanni DRI';

  public text: string =
    'Switch your Active Team Rocket\'s Pokémon with 1 of your Benched Team Rocket\'s Pokémon. ' +
    'If you do, switch in 1 of your opponent\'s Benched Pokémon to the Active Spot.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    return state;
  }
}
