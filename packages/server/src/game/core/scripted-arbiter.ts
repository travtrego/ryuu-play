import { CoinFlipPrompt, GameLog, Prompt, ResolvePromptAction, ShuffleDeckPrompt,
  State, StateLog } from '@ptcg/common';
import { Arbiter } from './arbiter';

/**
 * Learn mode: the Arbiter for a tutorial game.
 *
 * A tutorial has to teach one thing at a time, so every lesson must happen on
 * cue: you draw Charmeleon on the turn the evolve lesson runs, not whenever the
 * shuffle feels like it. This Arbiter removes both sources of randomness:
 *
 * - `ShuffleDeckPrompt` is answered with the identity order, which
 *   `CardList.applyOrder` applies as a no-op, so the deck keeps the order the
 *   tutorial deck authored. See `packages/common/src/game/tutorial-decks.ts`.
 * - `CoinFlipPrompt` is answered from a script.
 *
 * It is used **only** by `createTutorialGame`. Normal and guided games keep the
 * random `Arbiter`, so nothing here can change how an ordinary game shuffles.
 */
export class ScriptedArbiter extends Arbiter {

  /**
   * Answer for a flip after the script runs out. Heads, because a tutorial must
   * never stall: a tails on an "or this attack does nothing" card would leave
   * the lesson with nothing to explain.
   */
  public static readonly DEFAULT_FLIP = true;

  private flipIndex = 0;

  constructor(private flips: boolean[] = []) {
    super();
  }

  /** Flips used so far. Lets a spec show the script is consumed in order. */
  public get flipsUsed(): number {
    return this.flipIndex;
  }

  public resolvePrompt(state: State, prompt: Prompt<any>): ResolvePromptAction | undefined {
    const player = state.players.find(p => p.id === prompt.playerId);
    if (player === undefined) {
      return;
    }

    if (prompt instanceof ShuffleDeckPrompt) {
      return new ResolvePromptAction(prompt.id, ScriptedArbiter.identityOrder(player.deck.cards.length));
    }

    if (prompt instanceof CoinFlipPrompt) {
      const result = this.flipIndex < this.flips.length
        ? this.flips[this.flipIndex]
        : ScriptedArbiter.DEFAULT_FLIP;
      this.flipIndex++;
      const message = result
        ? GameLog.LOG_PLAYER_FLIPS_HEADS
        : GameLog.LOG_PLAYER_FLIPS_TAILS;
      const log = new StateLog(message, { name: player.name });
      return new ResolvePromptAction(prompt.id, result, log);
    }
  }

  /** [0, 1, ... len-1]: applyOrder treats this as "leave the deck alone". */
  public static identityOrder(len: number): number[] {
    const order: number[] = [];
    for (let i = 0; i < len; i++) {
      order.push(i);
    }
    return order;
  }

}
