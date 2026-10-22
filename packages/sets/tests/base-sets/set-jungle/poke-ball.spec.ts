import {
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
  SuperType,
} from '@ptcg/common';

import { Oddish } from '../../../src/base-sets/set-jungle/oddish';
import { PokeBall } from '../../../src/base-sets/set-jungle/poke-ball';
import { Vileplume } from '../../../src/base-sets/set-jungle/vileplume';
import { TestCard } from '../../test-cards/test-card';
import { TestUtils } from '../../test-utils';

describe('Poke Ball JU', () => {
  let sim: Simulator;
  let trainerCard: PokeBall;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new PokeBall();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  function resolveShowCards() {
    const prompt = TestUtils.lastPrompt(sim);
    if (prompt && prompt.type === 'Show cards' && prompt.result === undefined) {
      sim.dispatch(new ResolvePromptAction(prompt.id, true));
    }
  }

  // Flip a coin. If heads, you may search your deck for any Basic Pokémon or Evolution card. Show that card to your
  // opponent, then put it into your hand. Shuffle your deck afterward.
  it('Should play Poke Ball - heads, put a Basic Pokémon into your hand', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const oddish = new Oddish();
    const trainer = new TestCard();
    player.deck.cards = [trainer, oddish];
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({ type: 'Coin flip', playerId: player.id }));
    expect(prompts[1]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      cards: player.deck,
      filter: { superType: SuperType.POKEMON },
      options: jasmine.objectContaining({ max: 1 }),
    }));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [oddish]));
    resolveShowCards();

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([oddish]);
    expect(player.deck.cards).toEqual([trainer]);
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should play Poke Ball - heads, put an Evolution card into your hand', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const vileplume = new Vileplume();
    player.deck.cards = [vileplume, new TestCard()];
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [vileplume]));
    resolveShowCards();

    expect(player.hand.cards).toEqual([vileplume]);
  });

  it('Should play Poke Ball - heads, can\'t choose a non-Pokémon card', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const trainer = new TestCard();
    player.deck.cards = [trainer, new Oddish()];
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect((prompts[1] as any).validate([trainer])).toBeFalse();
  });

  it('Should play Poke Ball - heads, shows the card to the opponent', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    const oddish = new Oddish();
    player.deck.cards = [oddish];
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [oddish]));

    expect(prompts.some(p => p.type === 'Show cards' && p.playerId === opponent.id)).toBeTrue();
  });

  it('Should play Poke Ball - tails, nothing happens', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const oddish = new Oddish();
    player.deck.cards = [oddish];
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(prompts.length).toEqual(1);
    expect(player.hand.cards).toEqual([]);
    expect(player.deck.cards).toEqual([oddish]);
    expect(player.discard.cards).toEqual([trainerCard]);
  });
});
