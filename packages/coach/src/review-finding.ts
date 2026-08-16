import { CandidateDeltas } from './candidate-deltas';

// Findings split by how they can be established, and the distinction is
// load-bearing rather than bookkeeping.
//
// GROUNDED findings are computed by simulating the alternatives that were
// legally available and comparing measurable outcomes. They are facts about
// the game: a knockout was available and was not taken.
//
// JUDGEMENT findings are claims about plans - whether a sequence was right,
// whether resources were overcommitted, whether a better search target
// existed. Those depend on reading the opponent and the shape of the game, and
// a deterministic detector for them would be a heuristic dressed as a fact.
// They are defined here so a reasoning layer can populate them through the
// existing CoachingRequest, and are never emitted by the deterministic pass.
export enum ReviewFindingKind {
  MISSED_KO = 'MISSED_KO',
  MISSED_PRIZE = 'MISSED_PRIZE',
  MISSED_DAMAGE = 'MISSED_DAMAGE',
  RETREAT_WITHOUT_MEASURABLE_GAIN = 'RETREAT_WITHOUT_MEASURABLE_GAIN',

  GOOD_SEQUENCING = 'GOOD_SEQUENCING',
  MISSED_SETUP_OPPORTUNITY = 'MISSED_SETUP_OPPORTUNITY',
  RESOURCE_OVERCOMMITMENT = 'RESOURCE_OVERCOMMITMENT',
  BETTER_SEARCH_TARGET = 'BETTER_SEARCH_TARGET'
}

export const GROUNDED_FINDING_KINDS: ReviewFindingKind[] = [
  ReviewFindingKind.MISSED_KO,
  ReviewFindingKind.MISSED_PRIZE,
  ReviewFindingKind.MISSED_DAMAGE,
  ReviewFindingKind.RETREAT_WITHOUT_MEASURABLE_GAIN
];

export function isGroundedFinding(kind: ReviewFindingKind): boolean {
  return GROUNDED_FINDING_KINDS.includes(kind);
}

export interface ReviewFinding {
  kind: ReviewFindingKind;
  // Plain-language statement of what was missed or done well.
  summary: string;
  // The better line, when one existed. Engine-derived description.
  betterLine: string | null;
  // True when produced by simulation, false when supplied by a reasoning
  // layer. Consumers should present the two differently.
  grounded: boolean;
}

// Damage differences below this are not worth calling a mistake; they are
// usually just a different but comparable line.
const MATERIAL_DAMAGE_THRESHOLD = 30;

// Compares what the player's line achieved against the best any legally
// available alternative achieved. Only differences the simulator can
// demonstrate become findings.
export function detectGroundedFindings(
  actual: CandidateDeltas,
  alternatives: { description: string; deltas: CandidateDeltas }[]
): ReviewFinding[] {
  const findings: ReviewFinding[] = [];

  const koAvailable = alternatives.find(
    alternative => alternative.deltas.knocksOutOpponentActive === true
  );

  if (actual.knocksOutOpponentActive === false && koAvailable !== undefined) {
    findings.push({
      kind: ReviewFindingKind.MISSED_KO,
      summary: 'A knockout on the opponent\'s Active Pokémon was available and was not taken.',
      betterLine: koAvailable.description,
      grounded: true
    });
  }

  const actualPrizes = actual.prizesTaken;
  if (actualPrizes !== null) {
    const betterPrizes = alternatives.find(
      alternative => alternative.deltas.prizesTaken !== null
        && alternative.deltas.prizesTaken > actualPrizes
    );
    if (betterPrizes !== undefined) {
      findings.push({
        kind: ReviewFindingKind.MISSED_PRIZE,
        summary: 'Another line took more Prize cards on this turn.',
        betterLine: betterPrizes.description,
        grounded: true
      });
    }
  }

  const actualDamage = actual.damageToOpponentActive;
  if (actualDamage !== null && findings.length === 0) {
    const betterDamage = alternatives.find(
      alternative => alternative.deltas.damageToOpponentActive !== null
        && alternative.deltas.damageToOpponentActive - actualDamage >= MATERIAL_DAMAGE_THRESHOLD
    );
    if (betterDamage !== undefined) {
      findings.push({
        kind: ReviewFindingKind.MISSED_DAMAGE,
        summary: 'Another line dealt materially more damage.',
        betterLine: betterDamage.description,
        grounded: true
      });
    }
  }

  return findings;
}
