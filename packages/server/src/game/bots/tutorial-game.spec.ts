import { BotAi, BotAiFactory, GameError, GameMessage, GameSettings,
  tutorialBotDeck, tutorialPlayerDeck } from '@ptcg/common';
import { BotClient } from './bot-client';
import { Client } from '../client/client.interface';
import { Core } from '../core/core';
import { Game } from '../core/game';
import { Arbiter } from '../core/arbiter';
import { ScriptedArbiter } from '../core/scripted-arbiter';
import { createTutorialGame } from './tutorial-game';
import { createGuidedGame } from './guided-game';

class FakeBotAiFactory extends BotAiFactory {
  constructor() {
    super('fake');
  }
  public createBotAi(clientId: number, deck: string[] | null): BotAi {
    return { decodeNextAction: () => undefined };
  }
}

describe('Tutorial game', () => {
  let human: Client;
  let bot: BotClient;
  let createGame: jasmine.Spy;
  let core: Core;

  beforeEach(() => {
    human = { id: 1, name: 'human' } as Client;
    bot = new BotClient(new FakeBotAiFactory());
    bot.id = 2;
    createGame = jasmine.createSpy('createGame').and.returnValue({} as Game);
    core = { clients: [human, bot], createGame } as unknown as Core;
  });

  it('invites the first bot with the tutorial decks and a scripted arbiter', () => {
    createTutorialGame(core, human);

    expect(createGame).toHaveBeenCalledTimes(1);
    const [client, deck, settings, invited, invitedDeck, arbiter] = createGame.calls.mostRecent().args;
    expect(client).toBe(human);
    expect(deck).toEqual(tutorialPlayerDeck.cards);
    expect(settings instanceof GameSettings).toBe(true);
    expect(invited).toBe(bot);
    expect(invitedDeck).toEqual(tutorialBotDeck.cards);
    expect(arbiter instanceof ScriptedArbiter).toBeTrue();
  });

  it('passes the coin-flip script through to the arbiter', () => {
    createTutorialGame(core, human, [false, true]);
    const arbiter = createGame.calls.mostRecent().args[5] as ScriptedArbiter;
    expect(arbiter instanceof ScriptedArbiter).toBeTrue();
    expect(arbiter.flipsUsed).toEqual(0);
  });

  it('passes copies, so a game cannot change the shared deck lists', () => {
    createTutorialGame(core, human);
    const [, deck, , , invitedDeck] = createGame.calls.mostRecent().args;
    expect(deck).not.toBe(tutorialPlayerDeck.cards);
    expect(invitedDeck).not.toBe(tutorialBotDeck.cards);
  });

  it('fails with ERROR_BOT_NOT_FOUND when no bot is connected', () => {
    core.clients = [human];
    expect(() => createTutorialGame(core, human)).toThrow(new GameError(GameMessage.ERROR_BOT_NOT_FOUND));
    expect(createGame).not.toHaveBeenCalled();
  });

  // The gate. Scripting the tutorial must not script anything else.
  it('leaves the guided game on the random arbiter', () => {
    createGuidedGame(core, human);
    const arbiter = createGame.calls.mostRecent().args[5];
    expect(arbiter).toBeUndefined();
  });

  it('gives a Game with no arbiter argument the random Arbiter', () => {
    const game = new Game(core, 1, new GameSettings());
    const scripted = new Game(core, 2, new GameSettings(), new ScriptedArbiter());

    // The field is private, so check behaviour: the default shuffles, the
    // scripted one does not.
    expect((game as unknown as { arbiter: Arbiter }).arbiter instanceof ScriptedArbiter).toBeFalse();
    expect((scripted as unknown as { arbiter: Arbiter }).arbiter instanceof ScriptedArbiter).toBeTrue();
  });
});
