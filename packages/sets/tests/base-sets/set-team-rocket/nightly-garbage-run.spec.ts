import {
  CardType,
  ChooseCardsPrompt,
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { NightlyGarbageRun } from '../../../src/base-sets/set-team-rocket/nightly-garbage-run';
import { RainbowEnergy } from '../../../src/base-sets/set-team-rocket/rainbow-energy';
import { Sleep } from '../../../src/base-sets/set-team-rocket/sleep';
import { DarkCharmeleon } from '../../../src/base-sets/set-team-rocket/dark-charmeleon';
import { Charmander } from '../../../src/base-sets/set-team-rocket/charmander';
import { TestUtils } from '../../test-utils';

describe('Nightly Garbage Run TR', () => {
  let sim: Simulator;
  let trainerCard: NightlyGarbageRun;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new NightlyGarbageRun();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  // Choose up to 3 Basic Pokémon cards, Evolution cards, and/or basic Energy cards from your discard pile. Show
  // them to your opponent and shuffle them into your deck.
  it('Should shuffle up to 3 Pokémon and basic Energy cards from the discard pile into the deck', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const basic = new Charmander();
    const evolution = new DarkCharmeleon();
    const [energy, energy2] = TestUtils.makeEnergies([CardType.FIRE, CardType.WATER]);
    player.discard.cards = [basic, evolution, energy, energy2];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      options: jasmine.objectContaining({ max: 3 }),
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [basic, evolution, energy]));

    const show = TestUtils.lastPrompt(sim, opponent)!;
    expect(show).toEqual(jasmine.objectContaining({ type: 'Show cards', playerId: opponent.id }));
    sim.dispatch(new ResolvePromptAction(show.id, true));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.deck.cards.length).toEqual(53);
    [basic, evolution, energy].forEach(c => expect(player.deck.cards).toContain(c));
    expect(player.discard.cards.length).toEqual(2);
    expect(player.discard.cards).toContain(energy2);
    expect(player.discard.cards).toContain(trainerCard);
    expect(prompts.some(p => p.type === 'Shuffle deck' && p.playerId === player.id)).toBeTrue();
  });

  it('Should not allow choosing more than 3 cards', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const cards = TestUtils.makeEnergies([CardType.FIRE, CardType.FIRE, CardType.FIRE, CardType.FIRE]);
    player.discard.cards = cards.slice();

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    const prompt = prompts[0] as ChooseCardsPrompt;
    expect(prompt.validate(cards.slice(0, 3))).toBeTrue();
    expect(prompt.validate(cards)).toBeFalse();
  });

  it('Should not allow choosing Trainer or Special Energy cards', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const trainer = new Sleep();
    const special = new RainbowEnergy();
    const basic = new Charmander();
    player.discard.cards = [trainer, special, basic];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    const prompt = prompts[0] as ChooseCardsPrompt;
    expect(prompt.type).toEqual('Choose cards');
    expect(prompt.validate([basic])).toBeTrue();
    expect(prompt.validate([trainer])).toBeFalse();
    expect(prompt.validate([special])).toBeFalse();
  });

  it('Should not be playable without Pokémon or basic Energy cards in the discard pile', () => {
    const { player } = TestUtils.getAll(sim);
    player.discard.cards = [new Sleep(), new RainbowEnergy()];

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(TestUtils.getAll(sim).player.hand.cards.length).toEqual(1);
  });

  it('Should keep the card in hand when cancelled', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.discard.cards = [new Charmander()];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([trainerCard]);
    expect(player.discard.cards.length).toEqual(1);
    expect(player.deck.cards.length).toEqual(50);
  });
});
