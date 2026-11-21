import { MODERN_DECKS, modernDeckCards, modernDeckName } from './modern-decks';

describe('MODERN_DECKS', () => {

  it('has unique ids', () => {
    const ids = MODERN_DECKS.map(d => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every deck has 60 cards and a source', () => {
    for (const deck of MODERN_DECKS) {
      expect(modernDeckCards(deck).length).withContext(deck.id).toBe(60);
      expect(deck.source).withContext(deck.id).toContain('data/meta-decks/');
    }
  });

  it('every deck name fits the 32-character deck-name limit', () => {
    for (const deck of MODERN_DECKS) {
      const name = modernDeckName(deck);
      expect(name.length).withContext(deck.id).toBeLessThanOrEqual(32);
      expect(name.length).withContext(deck.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('lists each card name once per deck', () => {
    for (const deck of MODERN_DECKS) {
      const names = deck.cards.map(c => c[0]);
      expect(new Set(names).size).withContext(deck.id).toBe(names.length);
    }
  });

  it('expands counts into one entry per copy', () => {
    const cards = modernDeckCards({ id: 'x', name: 'x', source: '', cards: [['A', 2], ['B', 1]] });
    expect(cards).toEqual(['A', 'A', 'B']);
  });
});
