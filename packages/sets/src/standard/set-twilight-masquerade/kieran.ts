import {
  CardTag,
  ChoosePokemonPrompt,
  DealDamageEffect,
  Effect,
  EndTurnEffect,
  GameMessage,
  PlayerType,
  SelectPrompt,
  SlotType,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

const KIERAN_MARKER = 'KIERAN_MARKER';

function* playCard(next: Function, store: StoreLike, state: State, effect: TrainerEffect): IterableIterator<State> {
  const player = effect.player;
  const hasBench = player.bench.some(b => b.pokemons.cards.length > 0);

  // Choose 1. With an empty Bench only the damage half can do anything.
  let choice = 1;
  if (hasBench) {
    yield store.prompt(state, new SelectPrompt(
      player.id,
      GameMessage.CHOOSE_OPTION,
      ['Switch your Active Pokémon', '30 more damage to the opponent\'s Active Pokémon ex this turn'],
      { allowCancel: false }
    ), result => {
      choice = result;
      next();
    });
  }

  if (choice === 0) {
    return store.prompt(state, new ChoosePokemonPrompt(
      player.id,
      GameMessage.CHOOSE_POKEMON_TO_SWITCH,
      PlayerType.BOTTOM_PLAYER,
      [SlotType.BENCH],
      { allowCancel: false }
    ), targets => {
      if (targets && targets.length > 0) {
        player.switchPokemon(targets[0]);
      }
    });
  }

  player.marker.addMarker(KIERAN_MARKER, effect.trainerCard);
  return state;
}

export class Kieran extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public set: string = 'TWM';

  public name: string = 'Kieran';

  public fullName: string = 'Kieran TWM';

  public text: string =
    'Choose 1: Switch your Active Pokémon with 1 of your Benched Pokémon. During this turn, attacks used by ' +
    'your Pokémon do 30 more damage to your opponent\'s Active Pokémon ex and Active Pokémon V (before ' +
    'applying Weakness and Resistance).';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    if (effect instanceof DealDamageEffect && effect.player.marker.hasMarker(KIERAN_MARKER, this)) {
      const opponent = StateUtils.getOpponent(state, effect.player);
      const target = effect.target.getPokemonCard();
      // There are no Pokémon V in the modern format, so only ex is checked.
      if (effect.target === opponent.active && target !== undefined && target.tags.includes(CardTag.POKEMON_EX)) {
        effect.damage += 30;
      }
    }

    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(KIERAN_MARKER, this);
    }

    return state;
  }
}
