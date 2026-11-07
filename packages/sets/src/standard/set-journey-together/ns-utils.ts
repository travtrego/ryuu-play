import { PokemonCard } from '@ptcg/common';

const NS_PREFIX = 'N\'s ';

/** "N's Pokémon" are the Pokémon with "N's" in their name. */
export function isNsPokemon(card: PokemonCard | undefined): boolean {
  return card !== undefined && card.name.startsWith(NS_PREFIX);
}
