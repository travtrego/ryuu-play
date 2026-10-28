import { Action, Player, State, PokemonCard, Stage, PlayCardAction } from '@ptcg/common';
import { SimpleTactic } from './simple-tactics';

export class PlayBasicTactic extends SimpleTactic {

  public useTactic(state: State, player: Player): Action | undefined {
    const basicPokemon = player.hand.cards
      .find(c => c instanceof PokemonCard && c.stage === Stage.BASIC);

    const emptyBenchSlot = player.bench
      .find(b => b.pokemons.cards.length === 0);

    if (basicPokemon && emptyBenchSlot) {
      return new PlayCardAction(
        player.id,
        player.hand.cards.indexOf(basicPokemon),
        this.getCardTarget(player, state, emptyBenchSlot)
      );
    }
  }

  public explain(state: State, player: Player, action: Action): string {
    if (!(action instanceof PlayCardAction)) {
      return super.explain(state, player, action);
    }
    const card = player.hand.cards[action.handIndex];
    const name = card ? card.name : 'a Basic Pokémon';
    const benched = player.bench.filter(b => b.pokemons.cards.length > 0).length;
    const why = benched === 0
      ? ' With an empty Bench, a Knock Out on the Active Pokémon would lose the game.'
      : ' Benched Pokémon can evolve later or be sent out when the Active Pokémon is Knocked Out.';
    return `Put ${name} on the Bench. The bot plays a Basic Pokémon whenever there is room on its Bench.${why}`;
  }

}
