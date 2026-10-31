import { beginnerBotDeck, beginnerPlayerDeck } from '@ptcg/common';
import { SimpleBot } from '@ptcg/simple-bot';
import { registerCardSets } from './card-setup';
import { GameSeat, playGame } from './headless-game';

/**
 * The guided first game (learn mode) pairs these two decks. A beginner who
 * hits an engine error or a stuck game in their first game is a lost player,
 * so play the matchup end to end with the bot on both sides.
 */
describe('Beginner decks (guided first game)', () => {

  beforeAll(() => {
    registerCardSets();
  });

  [1, 2, 3, 4, 5, 6].forEach(seed => {
    it(`plays the guided matchup to a normal finish (seed ${seed})`, () => {
      const seats: [GameSeat, GameSeat] = [
        { name: 'player', bot: new SimpleBot('player'), deck: beginnerPlayerDeck.cards },
        { name: 'bot', bot: new SimpleBot('bot'), deck: beginnerBotDeck.cards }
      ];
      const result = playGame(seats, seed);
      expect(result.error).toBeUndefined();
      expect(['win', 'draw']).toContain(result.outcome);
      expect(result.finalPhase).toBe('FINISHED');
    });
  });
});
