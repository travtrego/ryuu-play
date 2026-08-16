# Integrating `@ptcg/coach`

What a server or UI layer needs in order to use the coach. **No server or UI
code exists yet** — this is the contract those layers should be built against.

## What this package is

A read-only advisory layer over the game engine. It never mutates state, never
dispatches actions, and never decides what is legal. Given a `State` and a
player id, it answers two questions:

- *What should this player do now, and why?*
- *Looking back at a finished game, where did this player go wrong?*

## Boundaries the integrator must preserve

These are not style preferences. Breaking any of them produces a coach that
cheats or lies.

1. **Build the snapshot for the player being coached, and nobody else.**
   `buildGameStateSnapshot(state, viewerPlayerId)` is viewer-scoped. Passing
   the opponent's id produces the opponent's view — correct behaviour, wrong
   audience. Never send one player's snapshot to the other.

2. **Never send raw `State` to a client or a model.** The engine's `State`
   contains both hands, both decks and all prize contents. The snapshot exists
   precisely to strip that. If you serialize `State` directly you have built a
   cheating coach, whatever the UI shows.

3. **The engine decides legality, always.** Every action reaching a user came
   from a tactic or prompt resolver and was validated by the engine. Do not
   construct an `Action` from model output.

4. **Positional identifiers stay positional.** `state.activePlayer` is an index
   into `state.players`, not a player id. Bench arrays are index-stable, with
   `null` for empty slots — do not compact them before display, or a
   recommendation naming "bench slot 3" will point at the wrong Pokémon.

## Live coaching

### Deterministic (synchronous)

```ts
import { HeuristicCoachAdvisor } from '@ptcg/coach';

const advisor = new HeuristicCoachAdvisor();
const recommendation = advisor.getRecommendation(state, playerId);
```

`undefined` means the player has no decision to make right now — not an error.
Render nothing.

### With a reasoning layer (asynchronous)

```ts
import { LlmCoachAdvisor, CoachingRequest, CoachReasoning } from '@ptcg/coach';

const advisor = new LlmCoachAdvisor(async (request: CoachingRequest) => {
  // Send `request` to a model. Return its choice, or undefined.
  return { chosenCandidateId: 'c0', rationale: '...' } as CoachReasoning;
}, { includeDeltas: true });

const recommendation = await advisor.getRecommendation(state, playerId);
```

The reasoner receives a `CoachingRequest` and may only reply with a
`chosenCandidateId` drawn from `request.candidates` plus prose. It has no way
to return an action. An unrecognised id, a malformed reply, a rejected promise
or a thrown error all fall back to the deterministic recommendation.

`includeDeltas` controls whether each candidate is simulated to compute its
consequences. It costs one simulation per candidate; leave it off if you only
need ranking.

## Response shape

```ts
interface CoachRecommendation {
  action: Action;            // engine-produced, safe to dispatch
  description: string;       // engine-derived, e.g. "Attack with Psystrike"
  rationale: string;         // the only field a reasoning layer controls
  kind: 'turn-action' | 'prompt-response';
  question: string | null;   // the prompt being answered, if any
  alternatives: CoachActionOption[];
}
```

**Display rule:** `description` is trustworthy, `rationale` is model output.
Render them distinguishably. A model that describes its choice inaccurately
cannot misreport what the move does, because the description is generated from
the action rather than from the prose — but only if you show both.

## Prompt decisions

When the engine has asked the player something, `kind` is `'prompt-response'`
and `question` holds the readable question. `action` is a `ResolvePromptAction`
carrying the suggested answer.

`GameStateSnapshot.pendingPrompt` describes the open question independently:

```ts
interface PromptSnapshot {
  id: number;
  type: string;
  question: string;
  min: number | null;
  max: number | null;
  allowCancel: boolean | null;
  choices: string[] | null;   // null when the prompt does not enumerate options
}
```

Only the viewer's own prompt ever appears here. A prompt addressed to the
opponent is reported as `null`, because its contents can be information the
viewer is not entitled to.

Alternatives for prompt decisions are filtered through the prompt's own
`validate()`. Note that `Prompt.validate()` in the base class returns `true`
unconditionally, so it is a rejection filter rather than an acceptance oracle —
cancelling is offered only when the prompt explicitly sets `allowCancel`.

## Postgame review

```ts
import { reviewGame, StateListSequence } from '@ptcg/coach';

const review = reviewGame(replay, playerId);          // Replay works directly
const review2 = reviewGame(new StateListSequence(states), playerId);
```

`reviewGame` takes anything satisfying `GameStateSequence`
(`getStateCount()` / `getState(position)`). A `Replay` from `@ptcg/common`
satisfies it structurally — no adapter needed. Note that `Replay.getState()`
deserializes cards by name, so the relevant sets must be registered with
`CardManager` before reviewing a real replay.

Each `ReviewedDecision` carries the position and turn, the snapshot **as it
stood at the time**, what the coach would have recommended, and any findings.
The snapshot is rebuilt from that state alone, so a review never shows the
player information they did not have when deciding — reviewing with hindsight
teaches the wrong lesson.

### Findings are of two kinds, and the UI should not blur them

**Grounded** findings — `MISSED_KO`, `MISSED_PRIZE`, `MISSED_DAMAGE`,
`RETREAT_WITHOUT_MEASURABLE_GAIN` — are computed by simulating the alternatives
that were legally available. They are facts.

**Judgement** findings — `GOOD_SEQUENCING`, `MISSED_SETUP_OPPORTUNITY`,
`RESOURCE_OVERCOMMITMENT`, `BETTER_SEARCH_TARGET` — are claims about plans.
The deterministic pass **never emits these**; they exist for a reasoning layer
to populate. Use `isGroundedFinding(kind)` and present the two differently:
one is "you missed a knockout", the other is "I think you overcommitted".

## Unknown outcomes

Every field of `CandidateDeltas` may be `null`, which means **unknown, not
zero**. The common case is a prompt response: the simulator refuses to start
from a state with unresolved prompts, which is exactly the state a player is in
while being asked something. Do not render `null` as `0` — claiming "deals 0
damage" for a line that was never simulated is inventing a fact.

## Failure behaviour

| Situation | Result |
| --- | --- |
| No decision available | `getRecommendation` returns `undefined` |
| Player not in the game | `undefined` |
| Reasoner throws, rejects, or returns `undefined` | deterministic recommendation |
| Reasoner returns an unknown candidate id | deterministic recommendation |
| Reasoner returns empty or non-string prose | engine rationale retained |
| A candidate cannot be simulated | that candidate's deltas are all `null` |
| A state in a sequence cannot be read | that position is skipped |
| Viewer not in a reviewed state | that position is skipped |

The coach degrades rather than failing. A missing reasoning layer costs
explanation quality, never correctness.

## Not yet decided

`packages/server` and `packages/play` are unassigned. When the API surface is
designed, the open questions are: whether recommendations are pushed with state
updates or pulled on demand, where the reasoner call is hosted, and how
coaching is rate-limited. This package takes no position on any of them.
