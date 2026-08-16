import { Action, BotArbiterOptions, Simulator, State } from '@ptcg/common';
import { buildGameStateSnapshot } from './game-state-snapshot';

// What an action actually does to the board, computed by running it through
// the simulator rather than described in prose. This is the grounding a
// reasoning layer explains from: it can argue about why 120 damage matters,
// but it does not get to decide whether the damage happens.
//
// Every field is null when the outcome could not be computed - see
// evaluateCandidate for when that occurs. Null means "unknown", never "zero".
export interface CandidateDeltas {
  damageToOpponentActive: number | null;
  knocksOutOpponentActive: boolean | null;
  prizesTaken: number | null;
  handSizeChange: number | null;
  endsTurn: boolean | null;
}

export const UNKNOWN_DELTAS: CandidateDeltas = {
  damageToOpponentActive: null,
  knocksOutOpponentActive: null,
  prizesTaken: null,
  handSizeChange: null,
  endsTurn: null
};

// Simulates an action and reports what changed, from the acting player's point
// of view.
//
// Returns UNKNOWN_DELTAS when the outcome cannot be established. The common
// case is a prompt response: the Simulator refuses to start from a state with
// unresolved prompts, which is exactly the state a player is in while being
// asked a question. Reporting nulls is deliberate - a coach that silently
// claimed "0 damage" for an unsimulated line would be inventing facts.
export function evaluateCandidate(
  state: State,
  playerId: number,
  action: Action,
  arbiter: Partial<BotArbiterOptions> = {}
): CandidateDeltas {
  let after: State;

  try {
    const simulator = new Simulator(state, arbiter);
    after = simulator.dispatch(action);
  } catch (error) {
    return { ...UNKNOWN_DELTAS };
  }

  try {
    const before = buildGameStateSnapshot(state, playerId);
    const result = buildGameStateSnapshot(after, playerId);

    const damageBefore = before.opponent.active?.damage ?? null;
    const damageAfter = result.opponent.active?.damage ?? null;

    // The opponent's Active is gone, or was replaced by a different Pokemon,
    // so a straight damage subtraction would be meaningless.
    const activeReplaced = before.opponent.active !== null
      && result.opponent.active !== null
      && before.opponent.active.pokemon.name !== result.opponent.active.pokemon.name;

    const knockedOut = before.opponent.active !== null
      && (result.opponent.active === null || activeReplaced);

    return {
      damageToOpponentActive: knockedOut || damageBefore === null || damageAfter === null
        ? null
        : damageAfter - damageBefore,
      knocksOutOpponentActive: knockedOut,
      // Prizes are taken from your own pile, so the count going down is you
      // scoring, not losing anything.
      prizesTaken: before.you.prizesLeft - result.you.prizesLeft,
      handSizeChange: result.you.handCount - before.you.handCount,
      endsTurn: result.turn > before.turn
    };
  } catch (error) {
    return { ...UNKNOWN_DELTAS };
  }
}
