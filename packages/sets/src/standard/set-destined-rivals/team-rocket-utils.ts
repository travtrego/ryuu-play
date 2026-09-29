import { PokemonCard, TrainerCard, TrainerType } from '@ptcg/common';

const TEAM_ROCKET_PREFIX = 'Team Rocket\'s ';

export function isTeamRocketsPokemon(card: PokemonCard | undefined): boolean {
  return card !== undefined && card.name.startsWith(TEAM_ROCKET_PREFIX);
}

export function isTeamRocketSupporter(card: TrainerCard | undefined): boolean {
  return card !== undefined
    && card.trainerType === TrainerType.SUPPORTER
    && card.name.includes('Team Rocket');
}
