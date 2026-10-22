import {
  ChooseCardsPrompt,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { TheBosssWay } from '../../../src/base-sets/set-team-rocket/the-bosss-way';
import { DarkCharmeleon } from '../../../src/base-sets/set-team-rocket/dark-charmeleon';
import { DarkCharizard } from '../../../src/base-sets/set-team-rocket/dark-charizard';
import { Charmander } from '../../../src/base-sets/set-team-rocket/charmander';
import { Charmeleon } from '../../../src/base-sets/set-base/charmeleon';
import { Sleep } from '../../../src/base-sets/set-team-rocket/sleep';
import { TestUtils } from '../../test-utils';

describe('The Boss\'s Way TR', () => {
  let sim: Simulator;
  let trainerCard: TheBosssWay;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new TheBosssWay();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  // Search your deck for an Evolution card with Dark in its name. Show it to your opponent and put it into your
  // hand. Shuffle your deck afterward.
  it('Should put a Dark Evolution card from the deck into the hand', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const darkCharmeleon = new DarkCharmeleon();
    const darkCharizard = new DarkCharizard();
    player.deck.cards = [new Charmander(), new Charmeleon(), darkCharmeleon, darkCharizard, new Sleep()];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    const prompt = prompts[0] as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({ type: 'Choose cards', playerId: player.id }));
    expect(prompt.validate([darkCharmeleon])).toBeTrue();
    expect(prompt.validate([darkCharizard])).toBeTrue();
    sim.dispatch(new ResolvePromptAction(prompt.id, [darkCharizard]));

    const show = TestUtils.lastPrompt(sim, opponent)!;
    expect(show).toEqual(jasmine.objectContaining({ type: 'Show cards', playerId: opponent.id }));
    sim.dispatch(new ResolvePromptAction(show.id, true));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([darkCharizard]);
    expect(player.deck.cards.length).toEqual(4);
    expect(player.discard.cards).toEqual([trainerCard]);
    expect(prompts.some(p => p.type === 'Shuffle deck' && p.playerId === player.id)).toBeTrue();
  });

  it('Should not allow choosing a non-Dark Evolution card, a Basic Pokémon or a Trainer', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const charmander = new Charmander();
    const charmeleon = new Charmeleon();
    const sleep = new Sleep();
    player.deck.cards = [charmander, charmeleon, sleep, new DarkCharmeleon()];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    const prompt = prompts[0] as ChooseCardsPrompt;
    expect(prompt.validate([charmander])).toBeFalse();
    expect(prompt.validate([charmeleon])).toBeFalse();
    expect(prompt.validate([sleep])).toBeFalse();
  });

  it('Should shuffle the deck when nothing is found', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.deck.cards = [new Charmander(), new Charmeleon()];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([]);
    expect(player.deck.cards.length).toEqual(2);
    expect(player.discard.cards).toEqual([trainerCard]);
  });
});
