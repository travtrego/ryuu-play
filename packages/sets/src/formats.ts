import { Card, CardType, EnergyCard, EnergyType, Rules } from '@ptcg/common';
import * as standard from './standard';

/**
 * Today's Standard format: the Scarlet & Violet / Mega Evolution era (2025-2027).
 *
 * Only the modern sets are included, so cards from older eras can't be mixed
 * in. A few cards here are older-mark prints (for example Energy Switch SVI,
 * Boss's Orders PAL); they are listed because the same card is legal today
 * through a reprint with the same name and text.
 *
 * Rules that differ from the engine defaults:
 * - the player who goes first can't play a Supporter on their first turn
 *   (unless the card says it can, `canUseOnFirstTurn`);
 * - the player who goes first can't attack on their first turn.
 * The player who goes first still draws a card. Pokémon ex give up 2 Prize
 * cards and a deck may hold only 1 ACE SPEC card; those rules live in the
 * engine for every format.
 */
export const MODERN_STANDARD_NAME = 'Standard (Scarlet & Violet)';

/**
 * Basic Energy is always legal. The eight basic types of today's game are
 * reused from the Diamond & Pearl set (same card objects, so a deck's basic
 * Energy is the same card in either format). Fairy Energy is left out: the
 * Fairy type is not in the Scarlet & Violet era.
 */
export const modernBasicEnergies: Card[] = standard.setDiamondAndPearl.filter(card =>
  card instanceof EnergyCard
  && card.energyType === EnergyType.BASIC
  && !card.provides.includes(CardType.FAIRY));

export const modernStandardSets: Card[][] = [
  modernBasicEnergies,
  standard.setScarletAndViolet,
  standard.setPaldeaEvolved,
  standard.setTemporalForces,
  standard.setTwilightMasquerade,
  standard.setShroudedFable,
  standard.setStellarCrown,
  standard.setJourneyTogether,
  standard.setPrismaticEvolutions,
  standard.setDestinedRivals,
  standard.setMegaEvolution,
  standard.setPhantasmalFlames,
  standard.setChaosRising,
  standard.setAscendedHeroes,
  standard.setPerfectOrder,
];

export function modernStandardRules(): Rules {
  return new Rules({
    firstTurnDrawCard: true,
    firstTurnUseSupporter: false,
    firstTurnAttack: false,
  });
}
