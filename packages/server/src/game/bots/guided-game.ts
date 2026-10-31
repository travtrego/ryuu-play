import { GameError, GameMessage, GameSettings, beginnerBotDeck, beginnerPlayerDeck } from '@ptcg/common';
import { BotClient } from './bot-client';
import { Client } from '../client/client.interface';
import { Core } from '../core/core';
import { Game } from '../core/game';

/**
 * Learn mode: a guided first game. The player does not need a saved deck:
 * they get the beginner Fire deck and the first connected bot plays the
 * beginner Lightning deck (see packages/common/src/game/beginner-decks.ts).
 * Unlimited rules, like a normal game created with default settings.
 */
export function createGuidedGame(core: Core, client: Client): Game {
  const bot = core.clients.find(c => c instanceof BotClient && c !== client);
  if (bot === undefined) {
    throw new GameError(GameMessage.ERROR_BOT_NOT_FOUND);
  }
  const gameSettings = new GameSettings();
  return core.createGame(
    client,
    beginnerPlayerDeck.cards.slice(),
    gameSettings,
    bot,
    beginnerBotDeck.cards.slice()
  );
}
