import {
  BeginnerDeck,
  Card,
  EnergyCard,
  EnergyType,
  PokemonCard,
  Stage,
  TrainerCard,
  beginnerBotDeck,
  beginnerPlayerDeck
} from '@ptcg/common';

import { setBase } from '../../src/base-sets/set-base';

/**
 * The guided first game hands these decks to a player who has never played.
 * They must be real, legal and as simple as the comment in
 * packages/common/src/game/beginner-decks.ts promises.
 */
describe('Beginner decks (guided first game)', () => {
  const byName: { [fullName: string]: Card } = {};
  setBase.forEach(card => { byName[card.fullName] = card; });

  const decks: BeginnerDeck[] = [beginnerPlayerDeck, beginnerBotDeck];
  const easyTrainers = ['Bill BS', 'Potion BS', 'Switch BS', 'PlusPower BS'];

  function cardsOf(deck: BeginnerDeck): Card[] {
    return deck.cards.map(name => byName[name]);
  }

  function typesOf(deck: BeginnerDeck): number[] {
    const types: number[] = [];
    cardsOf(deck).forEach(card => {
      if (card instanceof PokemonCard) {
        card.cardTypes.forEach(t => { if (!types.includes(t)) { types.push(t); } });
      }
    });
    return types;
  }

  decks.forEach(deck => {
    describe(deck.name, () => {

      it('should contain only Base Set cards that exist', () => {
        const missing = deck.cards.filter(name => byName[name] === undefined);
        expect(missing).toEqual([]);
      });

      it('should be a legal 60-card deck', () => {
        expect(deck.cards.length).toBe(60);
        const counts: { [name: string]: number } = {};
        cardsOf(deck).forEach(card => {
          if (card instanceof EnergyCard && card.energyType === EnergyType.BASIC) {
            return;
          }
          counts[card.name] = (counts[card.name] || 0) + 1;
        });
        Object.keys(counts).forEach(name => {
          expect(counts[name]).withContext(name).toBeLessThanOrEqual(4);
        });
        const basics = cardsOf(deck).filter(c => c instanceof PokemonCard && c.stage === Stage.BASIC);
        expect(basics.length).toBeGreaterThanOrEqual(12);
      });

      it('should only use Basic and Stage 1 Pokemon without Pokemon Powers', () => {
        cardsOf(deck).forEach(card => {
          if (card instanceof PokemonCard) {
            expect([Stage.BASIC, Stage.STAGE_1]).withContext(card.fullName).toContain(card.stage);
            expect(card.powers.length).withContext(card.fullName).toBe(0);
          }
        });
      });

      it('should have every Stage 1 evolve from a Basic in the same deck', () => {
        const names = cardsOf(deck).map(c => c.name);
        cardsOf(deck).forEach(card => {
          if (card instanceof PokemonCard && card.stage === Stage.STAGE_1) {
            expect(names).withContext(card.fullName).toContain(card.evolvesFrom);
          }
        });
      });

      it('should use only the easy Trainers and basic Energy', () => {
        cardsOf(deck).forEach(card => {
          if (card instanceof TrainerCard) {
            expect(easyTrainers).toContain(card.fullName);
          }
          if (card instanceof EnergyCard) {
            expect(card.energyType).withContext(card.fullName).toBe(EnergyType.BASIC);
          }
        });
      });
    });
  });

  it('should not give either side a Weakness to the other deck', () => {
    const pairs: Array<[BeginnerDeck, BeginnerDeck]> = [
      [beginnerPlayerDeck, beginnerBotDeck],
      [beginnerBotDeck, beginnerPlayerDeck]
    ];
    pairs.forEach(([defending, attacking]) => {
      const attackTypes = typesOf(attacking);
      cardsOf(defending).forEach(card => {
        if (card instanceof PokemonCard) {
          card.weakness.forEach(w => {
            expect(attackTypes).withContext(card.fullName).not.toContain(w.type);
          });
        }
      });
    });
  });
});
