import { Action, AppendLogAction, BotAi, BotAiFactory, GameLog, PassTurnAction, State } from '@ptcg/common';
import { BotGameHandler } from './bot-game-handler';
import { Client } from '../client/client.interface';
import { Game } from '../core/game';
import { config } from '../../config';

class FakeBotAi implements BotAi {
  public action: Action | undefined;
  public reason: string | undefined;
  public explainError = false;

  decodeNextAction(state: State): Action | undefined {
    const action = this.action;
    this.action = undefined; // act once, then wait
    return action;
  }

  explainLastAction(): string | undefined {
    if (this.explainError) {
      throw new Error('explain failed');
    }
    return this.reason;
  }
}

class FakeBotAiFactory extends BotAiFactory {
  constructor(private ai: BotAi) {
    super('fake');
  }

  public createBotAi(): BotAi {
    return this.ai;
  }
}

describe('BotGameHandler', () => {
  const clientId = 7;
  let ai: FakeBotAi;
  let dispatched: Action[];
  let dispatchError: Error | undefined;
  let game: Game;
  let client: Client;
  let originalDelay: number;

  const tick = () => new Promise<void>(resolve => setTimeout(resolve, 0));

  async function createHandler(): Promise<BotGameHandler> {
    const handler = new BotGameHandler(client, new FakeBotAiFactory(ai), game, Promise.resolve([]));
    await tick(); // let the deck promise resolve and the AI be created
    return handler;
  }

  beforeEach(() => {
    originalDelay = config.bots.actionDelay;
    config.bots.actionDelay = 0;
    ai = new FakeBotAi();
    dispatched = [];
    dispatchError = undefined;
    client = { id: clientId } as Client;
    game = {
      dispatch: (c: Client, action: Action) => {
        if (dispatchError && !(action instanceof AppendLogAction)) {
          throw dispatchError;
        }
        dispatched.push(action);
        return new State();
      }
    } as unknown as Game;
  });

  afterEach(() => {
    config.bots.actionDelay = originalDelay;
  });

  it('should log the reason right after the bot action', async () => {
    const handler = await createHandler();
    const action = new PassTurnAction(clientId);
    ai.action = action;
    ai.reason = 'Ended the turn without attacking: Pikachu has no attacks.';

    await handler.onStateChange(new State());

    expect(dispatched.length).toBe(2);
    expect(dispatched[0]).toBe(action);
    const log = dispatched[1] as AppendLogAction;
    expect(log instanceof AppendLogAction).toBe(true);
    expect(log.id).toBe(clientId);
    expect(log.message).toBe(GameLog.LOG_BOT_REASON);
    expect(log.params).toEqual({ text: 'Ended the turn without attacking: Pikachu has no attacks.' });
  });

  it('should not log anything when the bot has no reason', async () => {
    const handler = await createHandler();
    ai.action = new PassTurnAction(clientId);
    ai.reason = '   ';

    await handler.onStateChange(new State());

    expect(dispatched.length).toBe(1);
    expect(dispatched[0] instanceof PassTurnAction).toBe(true);
  });

  it('should still act when explaining throws', async () => {
    const handler = await createHandler();
    ai.action = new PassTurnAction(clientId);
    ai.explainError = true;

    await handler.onStateChange(new State());

    expect(dispatched.length).toBe(1);
    expect(dispatched[0] instanceof PassTurnAction).toBe(true);
  });

  it('should not explain an action the game rejected', async () => {
    const handler = await createHandler();
    ai.action = new PassTurnAction(clientId);
    ai.reason = 'Some reason.';
    dispatchError = new Error('not your turn');

    await handler.onStateChange(new State());

    expect(dispatched.length).toBe(0);
  });

  it('should work with bots that cannot explain', async () => {
    const plainAi: BotAi = {
      decodeNextAction: () => {
        plainAi.decodeNextAction = () => undefined;
        return new PassTurnAction(clientId);
      }
    };
    const handler = new BotGameHandler(client, new FakeBotAiFactory(plainAi), game, Promise.resolve([]));
    await tick();

    await handler.onStateChange(new State());

    expect(dispatched.length).toBe(1);
    expect(dispatched[0] instanceof PassTurnAction).toBe(true);
  });

});
