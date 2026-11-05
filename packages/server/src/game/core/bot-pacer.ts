/**
 * Learn mode: lets the player set the pace of the bot in a tutorial game.
 *
 * While the pacer is on, the bot waits before each move it makes on its own
 * turn until the player presses Continue, so the player can read the move it
 * just made and its "Why?" note before the next one lands. One Continue lets
 * through exactly one move. `release()` turns the pacer off for the rest of
 * the game (the tutorial is over), and lets through any move that is waiting.
 *
 * Only a tutorial game has a pacer (see `createTutorialGame`); in every other
 * game the bot keeps its normal speed.
 */
export class BotPacer {

  private released = false;
  private credit = false;
  private waiting: (() => void) | undefined;

  /** True while the bot is waiting for the player. */
  public get isWaiting(): boolean {
    return this.waiting !== undefined;
  }

  public get isReleased(): boolean {
    return this.released;
  }

  /**
   * Resolves when the bot may make its next move. Resolves at once when the
   * pacer is released, or when the player already pressed Continue.
   */
  public wait(): Promise<void> {
    if (this.released) {
      return Promise.resolve();
    }
    if (this.credit) {
      this.credit = false;
      return Promise.resolve();
    }
    return new Promise<void>(resolve => {
      this.waiting = resolve;
    });
  }

  /**
   * The player pressed Continue: let one move through. A press while the bot
   * is not waiting is kept for its next move, but presses do not add up, so
   * pressing twice never lets two moves through at once.
   */
  public step(): void {
    const waiting = this.waiting;
    if (waiting !== undefined) {
      this.waiting = undefined;
      waiting();
      return;
    }
    this.credit = true;
  }

  /** Forget a Continue press that no move used (the bot's turn is over). */
  public clear(): void {
    this.credit = false;
  }

  /** Stop pacing for the rest of the game. */
  public release(): void {
    this.released = true;
    this.credit = false;
    const waiting = this.waiting;
    this.waiting = undefined;
    if (waiting !== undefined) {
      waiting();
    }
  }

}
