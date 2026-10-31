import { BotAi, BotAiFactory, GameError, GameMessage, GameSettings, State, beginnerBotDeck, beginnerPlayerDeck } from '@ptcg/common';
import { BotClient } from './bot-client';
import { Client } from '../client/client.interface';
import { Core } from '../core/core';
import { Game } from '../core/game';
import { createGuidedGame } from './guided-game';

class FakeBotAiFactory extends BotAiFactory {
  public decks: Array<string[] | null> = [];

  constructor() {
    super('fake');
  }

  public createBotAi(clientId: number, deck: string[] | null): BotAi {
    this.decks.push(deck);
    return { decodeNextAction: () => undefined };
  }
}

class TestBotClient extends BotClient {
  public handlerFor(game: Game) {
    return this.addGameHandler(game);
  }
}

describe('Guided first game', () => {
  const tick = () => new Promise<void>(resolve => setTimeout(resolve, 0));

  let human: Client;
  let factory: FakeBotAiFactory;
  let bot: TestBotClient;
  let createGame: jasmine.Spy;
  let core: Core;

  beforeEach(() => {
    human = { id: 1, name: 'human' } as Client;
    factory = new FakeBotAiFactory();
    bot = new TestBotClient(factory);
    bot.id = 2;
    createGame = jasmine.createSpy('createGame').and.returnValue({} as Game);
    core = { clients: [human, bot], createGame } as unknown as Core;
  });

  it('should invite the first bot with the beginner decks', () => {
    createGuidedGame(core, human);

    expect(createGame).toHaveBeenCalledTimes(1);
    const [client, deck, settings, invited, invitedDeck] = createGame.calls.mostRecent().args;
    expect(client).toBe(human);
    expect(deck).toEqual(beginnerPlayerDeck.cards);
    expect(settings instanceof GameSettings).toBe(true);
    expect(invited).toBe(bot);
    expect(invitedDeck).toEqual(beginnerBotDeck.cards);
  });

  it('should pass copies, so a game cannot change the shared deck lists', () => {
    createGuidedGame(core, human);
    const [, deck, , , invitedDeck] = createGame.calls.mostRecent().args;
    expect(deck).not.toBe(beginnerPlayerDeck.cards);
    expect(invitedDeck).not.toBe(beginnerBotDeck.cards);
  });

  it('should fail with ERROR_BOT_NOT_FOUND when no bot is connected', () => {
    core.clients = [human];
    expect(() => createGuidedGame(core, human)).toThrow(new GameError(GameMessage.ERROR_BOT_NOT_FOUND));
    expect(createGame).not.toHaveBeenCalled();
  });

  it('should make the invited bot play the preset deck instead of a saved one', async () => {
    const loadDeck = spyOn(bot, 'loadDeck');
    const game = { state: new State(), invitedDeck: beginnerBotDeck.cards } as unknown as Game;

    bot.handlerFor(game);
    await tick();

    expect(loadDeck).not.toHaveBeenCalled();
    expect(factory.decks).toEqual([beginnerBotDeck.cards]);
  });

  it('should still load a saved deck in a normal game', async () => {
    const saved = ['Pikachu BS'];
    const loadDeck = spyOn(bot, 'loadDeck').and.returnValue(Promise.resolve(saved));
    const game = { state: new State(), invitedDeck: undefined } as unknown as Game;

    bot.handlerFor(game);
    await tick();

    expect(loadDeck).toHaveBeenCalledTimes(1);
    expect(factory.decks).toEqual([saved]);
  });
});
