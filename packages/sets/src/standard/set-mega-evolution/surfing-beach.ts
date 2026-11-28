import {
  CardType,
  CheckPokemonTypeEffect,
  ChoosePokemonPrompt,
  Effect,
  GameError,
  GameMessage,
  PlayerType,
  PokemonSlot,
  SlotType,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerType,
  UseStadiumEffect,
} from '@ptcg/common';

function isWater(store: StoreLike, state: State, slot: PokemonSlot): boolean {
  if (slot.pokemons.cards.length === 0) {
    return false;
  }
  const check = new CheckPokemonTypeEffect(slot);
  store.reduceEffect(state, check);
  return check.cardTypes.includes(CardType.WATER);
}

/** Surfing Beach — Mega Evolution 129 (Stadium). */
export class SurfingBeach extends TrainerCard {
  public trainerType: TrainerType = TrainerType.STADIUM;

  public set: string = 'MEG';

  public name: string = 'Surfing Beach';

  public fullName: string = 'Surfing Beach MEG';

  public text: string = 'Once during each player\'s turn, that player may switch their Active W Pokémon with 1 of ' +
    'their Benched W Pokémon.';

  public useWhenInPlay: boolean = true;

  /** True when the player could use Surfing Beach right now (ignoring the once-per-turn check). */
  public static canSwitch(store: StoreLike, state: State, player: { active: PokemonSlot, bench: PokemonSlot[] }): boolean {
    return isWater(store, state, player.active) && player.bench.some(b => isWater(store, state, b));
  }

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof UseStadiumEffect && StateUtils.getStadiumCard(state) === this) {
      const player = effect.player;
      const stadiumUsedTurn = player.stadiumUsedTurn;

      if (!SurfingBeach.canSwitch(store, state, player)) {
        player.stadiumUsedTurn = stadiumUsedTurn;
        throw new GameError(GameMessage.CANNOT_USE_STADIUM);
      }

      const blocked: { player: PlayerType, slot: SlotType, index: number }[] = [];
      player.bench.forEach((slot, index) => {
        if (slot.pokemons.cards.length > 0 && !isWater(store, state, slot)) {
          blocked.push({ player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index });
        }
      });

      return store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_SWITCH,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.BENCH],
        { allowCancel: true, blocked }
      ), targets => {
        if (!targets || targets.length === 0) {
          // UseStadiumAction marks the stadium as used before the card effect
          // runs; a cancelled optional use must restore that per-turn flag.
          player.stadiumUsedTurn = stadiumUsedTurn;
          return;
        }
        player.switchPokemon(targets[0]);
      });
    }

    return state;
  }
}
