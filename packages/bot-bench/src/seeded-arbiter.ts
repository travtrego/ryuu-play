import { CoinFlipPrompt, GameLog, Prompt, ResolvePromptAction, ShuffleDeckPrompt,
  State, StateLog } from '@ptcg/common';
import { Prng } from './prng';

/**
 * Seeded replacement for the server's Arbiter
 * (packages/server/src/game/core/arbiter.ts). It resolves the same two prompt
 * types with the same semantics (uniform Fisher-Yates shuffle, fair coin, the
 * same flip log line) but draws randomness from a seeded PRNG instead of
 * Math.random(). Engine code and BotArbiter are left untouched.
 */
export class SeededArbiter {

  constructor(private prng: Prng) { }

  public resolvePrompt(state: State, prompt: Prompt<any>): ResolvePromptAction | undefined {
    const player = state.players.find(p => p.id === prompt.playerId);
    if (player === undefined) {
      return;
    }

    if (prompt instanceof ShuffleDeckPrompt) {
      return new ResolvePromptAction(prompt.id, this.shuffle(player.deck.cards.length));
    }

    if (prompt instanceof CoinFlipPrompt) {
      const result = this.prng.nextBoolean();
      const message = result
        ? GameLog.LOG_PLAYER_FLIPS_HEADS
        : GameLog.LOG_PLAYER_FLIPS_TAILS;
      const log = new StateLog(message, { name: player.name });
      return new ResolvePromptAction(prompt.id, result, log);
    }
  }

  private shuffle(len: number): number[] {
    const order: number[] = [];
    for (let i = 0; i < len; i++) {
      order.push(i);
    }
    for (let i = len - 1; i > 0; i--) {
      const position = this.prng.nextInt(i + 1);
      [order[i], order[position]] = [order[position], order[i]];
    }
    return order;
  }

}
