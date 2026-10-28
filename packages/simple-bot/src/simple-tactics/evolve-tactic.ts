import { Action, Player, State, PokemonCard, PlayerType, CardTarget, PlayCardAction } from '@ptcg/common';
import { SimpleTactic } from './simple-tactics';
import { describeEvolution, getOwnSlot } from '../explain/explain-utils';

export class EvolveTactic extends SimpleTactic {

  public useTactic(state: State, player: Player): Action | undefined {
    const pokemons: {card: PokemonCard, target: CardTarget}[] = [];

    player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (pokemonSlot, card, target) => {
      if (pokemonSlot.pokemonPlayedTurn !== state.turn) {
        pokemons.push({ card, target });
      }
    });

    for (let i = 0; i < pokemons.length; i++) {
      const evolution = player.hand.cards.find(c => {
        return c instanceof PokemonCard && c.evolvesFrom === pokemons[i].card.name;
      });
      if (evolution) {
        return new PlayCardAction(
          player.id,
          player.hand.cards.indexOf(evolution),
          pokemons[i].target
        );
      }
    }
  }

  public explain(state: State, player: Player, action: Action): string {
    if (!(action instanceof PlayCardAction)) {
      return super.explain(state, player, action);
    }
    const evolution = player.hand.cards[action.handIndex];
    const slot = getOwnSlot(player, action.target);
    const from = slot && slot.getPokemonCard();
    if (!(evolution instanceof PokemonCard) || from === undefined) {
      return super.explain(state, player, action);
    }
    const gain = describeEvolution(from, evolution);
    return `Evolved ${from.name} into ${evolution.name}`
      + (gain ? ` (${gain})` : '')
      + '. The bot evolves whenever it can, because evolved Pokémon are usually stronger.';
  }

}
