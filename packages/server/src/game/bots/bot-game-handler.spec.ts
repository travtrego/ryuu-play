import { Action, AppendLogAction, BotAi, BotAiFactory, GameLog, GamePhase, PassTurnAction, Player,
  State } from '@ptcg/common';
import { BotPacer } from '../core/bot-pacer';
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


  describe('in a tutorial game (with a pacer)', () => {
    let pacer: BotPacer;

    function turnOf(playerId: number, phase: GamePhase = GamePhase.PLAYER_TURN): State {
      const state = new State();
      state.phase = phase;
      const me = new Player();
      me.id = clientId;
      const other = new Player();
      other.id = clientId + 1;
      state.players = [me, other];
      state.activePlayer = playerId === clientId ? 0 : 1;
      return state;
    }

    beforeEach(() => {
      pacer = new BotPacer();
      (game as unknown as { botPacer: BotPacer }).botPacer = pacer;
    });

    it('waits for Continue before a move on its own turn, then logs the reason', async () => {
      const handler = await createHandler();
      ai.action = new PassTurnAction(clientId);
      ai.reason = 'Ended the turn.';

      const done = handler.onStateChange(turnOf(clientId));
      await tick();
      expect(dispatched.length).toBe(0);
      expect(pacer.isWaiting).toBeTrue();

      pacer.step();
      await done;
      expect(dispatched.length).toBe(2);
      expect(dispatched[0] instanceof PassTurnAction).toBe(true);
      expect((dispatched[1] as AppendLogAction).params).toEqual({ text: 'Ended the turn.' });
    });

    it('does not wait during setup or on the player\'s turn', async () => {
      const handler = await createHandler();
      ai.action = new PassTurnAction(clientId);
      await handler.onStateChange(turnOf(clientId, GamePhase.SETUP));
      expect(dispatched.length).toBe(1);

      ai.action = new PassTurnAction(clientId);
      await handler.onStateChange(turnOf(clientId + 1));
      expect(dispatched.length).toBe(2);
      expect(pacer.isWaiting).toBeFalse();
    });

    it('drops a Continue press left over from its last turn', async () => {
      const handler = await createHandler();
      pacer.step(); // pressed, but the bot's turn ended before using it
      await handler.onStateChange(turnOf(clientId + 1));

      ai.action = new PassTurnAction(clientId);
      const done = handler.onStateChange(turnOf(clientId));
      await tick();
      expect(dispatched.length).toBe(0);
      expect(pacer.isWaiting).toBeTrue();
      pacer.release();
      await done; // finish here, so the move can't land in the next spec
      expect(dispatched.length).toBe(1);
    });

    it('plays at normal speed once released', async () => {
      const handler = await createHandler();
      pacer.release();
      ai.action = new PassTurnAction(clientId);
      await handler.onStateChange(turnOf(clientId));
      expect(dispatched.length).toBe(1);
    });

    it('does not wait in a game without a pacer', async () => {
      (game as unknown as { botPacer: BotPacer | undefined }).botPacer = undefined;
      const handler = await createHandler();
      ai.action = new PassTurnAction(clientId);
      await handler.onStateChange(turnOf(clientId));
      expect(dispatched.length).toBe(1);
    });
  });

});
