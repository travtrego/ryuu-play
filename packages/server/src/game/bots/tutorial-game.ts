import { GameError, GameMessage, GameSettings, Rules, tutorialBotDeck, tutorialPlayerDeck } from '@ptcg/common';
import { BotClient } from './bot-client';
import { Client } from '../client/client.interface';
import { Core } from '../core/core';
import { Game } from '../core/game';
import { ScriptedArbiter } from '../core/scripted-arbiter';

/**
 * Learn mode: a tutorial game.
 *
 * Like the guided game (`guided-game.ts`) it needs no saved deck and puts the
 * player against a bot, but it is **not random**: it uses the tutorial decks in
 * their authored order and a `ScriptedArbiter`, so every lesson lands on the
 * turn the script expects.
 *
 * The coin-flip script is deliberately empty for now. The lesson script
 * (the next piece of this work) is what knows which flips a lesson needs;
 * until then every flip answers `ScriptedArbiter.DEFAULT_FLIP`.
 */
export function createTutorialGame(core: Core, client: Client, flips: boolean[] = []): Game {
  const bot = core.clients.find(c => c instanceof BotClient && c !== client);
  if (bot === undefined) {
    throw new GameError(GameMessage.ERROR_BOT_NOT_FOUND);
  }
  const gameSettings = new GameSettings();
  // Copied into state.rules by the Game constructor, before the first dispatch,
  // so even the first state the client sees is marked as a tutorial.
  gameSettings.rules = new Rules({ tutorial: true });
  return core.createGame(
    client,
    tutorialPlayerDeck.cards.slice(),
    gameSettings,
    bot,
    tutorialBotDeck.cards.slice(),
    new ScriptedArbiter(flips)
  );
}
