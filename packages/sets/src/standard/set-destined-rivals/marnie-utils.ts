import { Card, PokemonCard } from '@ptcg/common';

const MARNIE_PREFIX = 'Marnie\'s ';

/** A "Marnie's Pokémon" is a Pokémon card whose name starts with "Marnie's". */
export function isMarniesPokemon(card: Card | undefined): boolean {
  return card instanceof PokemonCard && card.name.startsWith(MARNIE_PREFIX);
}
