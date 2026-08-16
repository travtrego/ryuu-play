import { State } from '@ptcg/common';

// The minimum a postgame reviewer needs from a finished game: the states it
// passed through, in order.
//
// Deliberately structural rather than importing Replay. Replay.getState()
// routes through the state serializer, which reconstructs cards by name and
// therefore needs a populated CardManager - binding to it directly would make
// every coach test depend on which cards happen to be registered. A real
// Replay satisfies this interface as-is, and tests can supply plain arrays.
export interface GameStateSequence {
  getStateCount(): number;
  getState(position: number): State;
}

// Wraps an in-memory list of states, for tests and for callers that already
// hold the states they want reviewed.
export class StateListSequence implements GameStateSequence {

  constructor(private states: State[]) {}

  public getStateCount(): number {
    return this.states.length;
  }

  public getState(position: number): State {
    if (position < 0 || position >= this.states.length) {
      throw new Error(`No state at position ${position}.`);
    }
    return this.states[position];
  }

}
