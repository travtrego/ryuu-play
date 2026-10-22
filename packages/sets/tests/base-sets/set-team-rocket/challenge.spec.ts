import {
  ChooseCardsPrompt,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Challenge } from '../../../src/base-sets/set-team-rocket/challenge';
import { Charmander } from '../../../src/base-sets/set-team-rocket/charmander';
import { DarkCharmeleon } from '../../../src/base-sets/set-team-rocket/dark-charmeleon';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Challenge! TR', () => {
  let sim: Simulator;
  let trainerCard: Challenge;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new Challenge();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  // Ask your opponent if he or she accepts your challenge. If your opponent declines (or if both Benches are
  // full), draw 2 cards. If your opponent accepts, each of you searches your decks for any number of Basic Pokémon
  // cards and puts them face down onto your Benches. (A player can't do this if his or her Bench is full.) When
  // you both have finished, shuffle your decks and turn those cards face up.
  it('Should ask the opponent to accept the challenge', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({ type: 'Confirm', playerId: opponent.id }));
  });

  // BUG: after the opponent declines and the player draws 2 cards, both players are still asked to search their decks
  xit('Should draw 2 cards when the opponent declines, without any search', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    player.deck.cards = [new Charmander(), ...TestUtils.makeTestCards(5)];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, false));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(prompts.some(p => p.type === 'Choose cards')).toBeFalse();
    expect(player.hand.cards.length).toEqual(2);
    expect(player.deck.cards.length).toEqual(4);
    expect(player.bench.every(b => b.pokemons.cards.length === 0)).toBeTrue();
    expect(opponent.bench.every(b => b.pokemons.cards.length === 0)).toBeTrue();
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should draw 2 cards without asking when both Benches are full', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    for (let i = 0; i < 5; i++) {
      player.bench[i] = TestUtils.pokemonSlot([new TestPokemon()]);
      opponent.bench[i] = TestUtils.pokemonSlot([new TestPokemon()]);
    }

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(prompts.length).toEqual(0);
    expect(player.hand.cards.length).toEqual(2);
    expect(player.deck.cards.length).toEqual(48);
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should let both players put Basic Pokémon from their decks onto their Benches when accepted', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const myBasics = [new Charmander(), new Charmander()];
    const theirBasic = new Charmander();
    player.deck.cards = [...myBasics, new DarkCharmeleon(), ...TestUtils.makeTestCards(3)];
    opponent.deck.cards = [theirBasic, ...TestUtils.makeTestCards(3)];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, true));

    const choose = prompts.filter(p => p.type === 'Choose cards') as ChooseCardsPrompt[];
    const mine = choose.find(p => p.playerId === player.id)!;
    const theirs = choose.find(p => p.playerId === opponent.id)!;
    expect(mine.validate(myBasics)).toBeTrue();
    expect(mine.validate([player.deck.cards[2]])).toBeFalse(); // Evolution card
    sim.dispatch(new ResolvePromptAction(mine.id, myBasics));
    sim.dispatch(new ResolvePromptAction(theirs.id, [theirBasic]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.bench[0].pokemons.cards).toEqual([myBasics[0]]);
    expect(player.bench[1].pokemons.cards).toEqual([myBasics[1]]);
    expect(opponent.bench[0].pokemons.cards).toEqual([theirBasic]);
    // Turned face up after both finished
    expect(player.bench[0].pokemons.isPublic).toBeTrue();
    expect(opponent.bench[0].pokemons.isPublic).toBeTrue();
    expect(player.deck.cards.length).toEqual(4);
    expect(opponent.deck.cards.length).toEqual(3);
    // No cards drawn
    expect(player.hand.cards).toEqual([]);
    expect(player.discard.cards).toEqual([trainerCard]);
    expect(prompts.some(p => p.type === 'Shuffle deck' && p.playerId === player.id)).toBeTrue();
    expect(prompts.some(p => p.type === 'Shuffle deck' && p.playerId === opponent.id)).toBeTrue();
  });

  // BUG: the opponent's selection is truncated to the number of empty slots on the player's Bench (slots instead of
  // slotsOpponent)
  xit('Should let the opponent fill his or her own empty Bench slots when the player has fewer free', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    for (let i = 0; i < 4; i++) {
      player.bench[i] = TestUtils.pokemonSlot([new TestPokemon()]);
    }
    const theirBasics = [new Charmander(), new Charmander(), new Charmander()];
    opponent.deck.cards = [...theirBasics, ...TestUtils.makeTestCards(3)];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, true));

    const choose = prompts.filter(p => p.type === 'Choose cards');
    const mine = choose.find(p => p.playerId === player.id)!;
    const theirs = choose.find(p => p.playerId === opponent.id)!;
    sim.dispatch(new ResolvePromptAction(mine.id, []));
    sim.dispatch(new ResolvePromptAction(theirs.id, theirBasics));

    expect(opponent.bench[0].pokemons.cards).toEqual([theirBasics[0]]);
    expect(opponent.bench[1].pokemons.cards).toEqual([theirBasics[1]]);
    expect(opponent.bench[2].pokemons.cards).toEqual([theirBasics[2]]);
    expect(opponent.deck.cards.length).toEqual(3);
  });
});
