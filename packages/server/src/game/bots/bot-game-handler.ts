import { Action, AppendLogAction, BotAi, BotAiFactory, GameLog } from '@ptcg/common';
import { State } from '@ptcg/common';
import { Client } from '../client/client.interface';
import { Game } from '../core/game';
import { config } from '../../config';

export class BotGameHandler {

  private ai: BotAi | undefined;
  private state: State | undefined;
  private changeInProgress: boolean = false;

  constructor(
    private client: Client,
    private botAiFactory: BotAiFactory,
    public game: Game,
    deckPromise: Promise<string[]>
  ) {
    this.waitForDeck(deckPromise);
  }

  public async onStateChange(state: State): Promise<void> {
    if (!this.ai || this.changeInProgress) {
      this.state = state;
      return;
    }

    this.state = undefined;
    this.changeInProgress = true;

    const action = this.ai.decodeNextAction(state);
    if (action) {
      const reason = this.explainLastAction();
      await this.waitAndDispatch(action, reason);
    }

    this.changeInProgress = false;
    // A state change was ignored, because we were processing
    if (this.state) {
      this.onStateChange(this.state);
    }
  }

  private async waitForDeck(deckPromise: Promise<string[]>): Promise<void> {
    let deck: string[] | null = null;
    try {
      deck = await deckPromise;
    } catch (error) {
      // continue regardless of error
    }

    this.ai = this.botAiFactory.createBotAi(this.client.id, deck);

    // A state change was ignored, because we were loading the deck
    if (this.state) {
      this.onStateChange(this.state);
    }
  }

  /**
   * Learn mode: the bot's own plain-language reason for the action it just
   * chose, if it has one. Never throws.
   */
  private explainLastAction(): string | undefined {
    if (!this.ai || !this.ai.explainLastAction) {
      return undefined;
    }
    try {
      const reason = this.ai.explainLastAction();
      if (typeof reason !== 'string') {
        return undefined;
      }
      const text = reason.trim();
      return text.length > 0 ? text : undefined;
    } catch (error) {
      return undefined;
    }
  }

  private waitAndDispatch(action: Action, reason?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let dispatched = false;
        try {
          this.game.dispatch(this.client, action);
          dispatched = true;
        } catch (error) {
          // continue regardless of error
        }
        // Only explain moves that actually happened; the reason goes into
        // the game log right after the log entries of the action itself.
        if (dispatched && reason !== undefined) {
          try {
            const log = new AppendLogAction(this.client.id, GameLog.LOG_BOT_REASON, { text: reason });
            this.game.dispatch(this.client, log);
          } catch (error) {
            // the explanation is optional, never break the game for it
          }
        }
        resolve();
      }, config.bots.actionDelay);
    });
  }

}
