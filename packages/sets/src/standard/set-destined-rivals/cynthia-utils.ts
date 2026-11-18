import { PokemonCard } from '@ptcg/common';

const CYNTHIA_PREFIX = 'Cynthia\'s ';

/** A "Cynthia's Pokémon" is a Pokémon card whose name starts with "Cynthia's". */
export function isCynthiasPokemon(card: PokemonCard | undefined): boolean {
  return card !== undefined && card.name.startsWith(CYNTHIA_PREFIX);
}
