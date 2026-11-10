import {
  CheckAttackCountEffect,
  PokemonCard,
  Power,
  PowerEffect,
  PowerType,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

export const FESTIVAL_GROUNDS_NAME = 'Festival Grounds';

export const FESTIVAL_LEAD_NAME = 'Festival Lead';

/** The Festival Lead Ability, printed the same on Dipplin, Goldeen and Seaking. */
export function festivalLeadPower(): Power {
  return {
    name: FESTIVAL_LEAD_NAME,
    powerType: PowerType.ABILITY,
    text: 'If Festival Grounds is in play, this Pokémon may use an attack it has twice. If the first attack ' +
      'Knocks Out your opponent\'s Active Pokémon, you may attack again after your opponent chooses a new ' +
      'Active Pokémon.',
  };
}

export function isFestivalGroundsInPlay(state: State): boolean {
  const stadium = StateUtils.getStadiumCard(state);
  return stadium !== undefined && stadium.name === FESTIVAL_GROUNDS_NAME;
}

/**
 * Festival Lead: the Active Pokémon with this Ability may attack twice while
 * Festival Grounds is in play. The engine asks `CheckAttackCountEffect` after
 * each attack; Knock Outs are resolved before the second attack.
 */
export function applyFestivalLead(
  store: StoreLike,
  state: State,
  effect: CheckAttackCountEffect,
  card: PokemonCard,
  power: Power
): void {
  if (effect.target !== effect.player.active || effect.target.getPokemonCard() !== card) {
    return;
  }
  if (!isFestivalGroundsInPlay(state)) {
    return;
  }
  try {
    store.reduceEffect(state, new PowerEffect(effect.player, power, card));
  } catch {
    return;
  }
  effect.attackCount = Math.max(effect.attackCount, 2);
}
