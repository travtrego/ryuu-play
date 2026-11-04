import {
  BeginnerDeck,
  Card,
  PokemonCard,
  Stage,
  SuperType,
  TUTORIAL_HAND_SIZE,
  TUTORIAL_PRIZE_COUNT,
  beginnerBotDeck,
  beginnerPlayerDeck,
  tutorialBotDeck,
  tutorialPlayerDeck
} from '@ptcg/common';

import { setBase } from '../../src/base-sets/set-base';

/**
 * The tutorial decks are played in a fixed order with no shuffling, so their
 * order is load-bearing in a way a normal deck's is not. These specs cover the
 * things that order can get wrong.
 */
describe('Tutorial decks (scripted first game)', () => {
  const byName: { [fullName: string]: Card } = {};
  setBase.forEach(card => { byName[card.fullName] = card; });

  const pairs: { tutorial: BeginnerDeck, beginner: BeginnerDeck }[] = [
    { tutorial: tutorialPlayerDeck, beginner: beginnerPlayerDeck },
    { tutorial: tutorialBotDeck, beginner: beginnerBotDeck }
  ];

  function openingHand(deck: BeginnerDeck): Card[] {
    return deck.cards.slice(0, TUTORIAL_HAND_SIZE).map(name => byName[name]);
  }

  function isBasicPokemon(card: Card): boolean {
    return card !== undefined
      && card.superType === SuperType.POKEMON
      && (card as PokemonCard).stage === Stage.BASIC;
  }

  pairs.forEach(({ tutorial, beginner }) => {

    describe(tutorial.name, () => {

      // The whole point: a fixed order that is still a legal deck. Being a
      // permutation of a deck already covered by beginner-decks.spec.ts means
      // legality cannot drift as the order is tuned.
      it('is a permutation of the matching beginner deck', () => {
        expect(tutorial.cards.length).toEqual(60);
        expect(tutorial.cards.slice().sort()).toEqual(beginner.cards.slice().sort());
      });

      it('names only cards that exist in Base Set', () => {
        tutorial.cards.forEach(name => {
          expect(byName[name]).withContext(name).toBeDefined();
        });
      });

      // Setup loops `while (!playerHasBasic || !opponentHasBasic)`, reshuffling
      // and redrawing until both players hold a Basic. With no shuffle the
      // redraw returns the same seven cards, so an opening hand without a Basic
      // would hang the game instead of mulliganing.
      it('opens with a Basic Pokemon in hand, so setup cannot loop forever', () => {
        const basics = openingHand(tutorial).filter(isBasicPokemon);
        expect(basics.length).withContext('Basic Pokemon in the opening hand').toBeGreaterThan(0);
      });

      it('puts a Basic Pokemon first, to be the Active Pokemon', () => {
        expect(isBasicPokemon(byName[tutorial.cards[0]])).toBeTrue();
      });

      // Cards 1-7 are the hand and 8-13 the Prizes, so the first lesson draw is
      // card 14. There has to be a deck left underneath it.
      it('has cards left to draw after the hand and the Prizes', () => {
        expect(tutorial.cards.length).toBeGreaterThan(TUTORIAL_HAND_SIZE + TUTORIAL_PRIZE_COUNT);
      });

    });

  });

  // Lesson-specific expectations. These are what make the deck a *tutorial*
  // deck rather than just a fixed one, and they are the assertions to update
  // when the lesson script moves a lesson to a different turn.
  describe('lesson cues in the player deck', () => {

    it('opens with Energy to attach and a second Basic to Bench', () => {
      const hand = tutorialPlayerDeck.cards.slice(0, TUTORIAL_HAND_SIZE);
      expect(hand).toContain('Fire Energy BS');
      expect(hand.filter(name => isBasicPokemon(byName[name])).length).toBeGreaterThan(1);
    });

    it('opens with a Trainer to play', () => {
      const hand = tutorialPlayerDeck.cards.slice(0, TUTORIAL_HAND_SIZE);
      expect(hand.some(name => byName[name].superType === SuperType.TRAINER)).toBeTrue();
    });

    it('holds Charmeleon back for the evolve lesson, not in the opening hand', () => {
      const hand = tutorialPlayerDeck.cards.slice(0, TUTORIAL_HAND_SIZE);
      expect(hand).not.toContain('Charmeleon BS');
      // Drawn soon after the Prizes, so the lesson comes early in the game
      const drawIndex = tutorialPlayerDeck.cards.indexOf('Charmeleon BS');
      expect(drawIndex).toBeGreaterThanOrEqual(TUTORIAL_HAND_SIZE + TUTORIAL_PRIZE_COUNT);
      expect(drawIndex).toBeLessThan(TUTORIAL_HAND_SIZE + TUTORIAL_PRIZE_COUNT + 6);
    });

    it('can evolve what it opens with: Charmander is Active and Charmeleon evolves from it', () => {
      expect(tutorialPlayerDeck.cards[0]).toEqual('Charmander BS');
      const charmeleon = byName['Charmeleon BS'] as PokemonCard;
      expect(charmeleon.evolvesFrom).toEqual('Charmander');
    });

  });

});
