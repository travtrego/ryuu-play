import {
  AttachEnergyPrompt,
  CardType,
  ChooseCardsPrompt,
  PlayCardAction,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { Crispin } from '../../../src/standard/set-stellar-crown/crispin';
import { TestEnergy } from '../../test-cards/test-energy';
import { TestUtils } from '../../test-utils';

describe('Crispin SCR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  function play() {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [new Crispin()];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    return TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
  }

  function resolveShow() {
    const { opponent } = TestUtils.getAll(sim);
    const show = TestUtils.lastPrompt(sim, opponent);
    if (show && show.result === undefined) {
      sim.dispatch(new ResolvePromptAction(show.id, true));
    }
  }

  it('2 Basic Energy of different types: 1 attached, the other to the hand', () => {
    const { player } = TestUtils.getAll(sim);
    const fire = new TestEnergy(CardType.FIRE);
    const psychic = new TestEnergy(CardType.PSYCHIC);
    player.deck.cards = [fire, psychic, ...TestUtils.makeTestCards(3)];

    const choose = play();
    expect(choose.options.differentTypes).toBeTrue();
    expect(choose.validate([fire, new TestEnergy(CardType.FIRE)])).toBeFalse();
    sim.dispatch(new ResolvePromptAction(choose.id, [fire, psychic]));
    resolveShow();

    const attach = TestUtils.lastPrompt(sim, player) as AttachEnergyPrompt;
    expect(attach instanceof AttachEnergyPrompt).toBeTrue();
    sim.dispatch(new ResolvePromptAction(attach.id, [
      { to: { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 }, card: psychic }
    ]));

    expect(player.active.energies.cards).toEqual([psychic]);
    expect(player.hand.cards).toEqual([fire]);
    expect(player.deck.cards.length).toEqual(3);
  });

  it('1 Basic Energy found goes to the hand', () => {
    const { player } = TestUtils.getAll(sim);
    const fire = new TestEnergy(CardType.FIRE);
    player.deck.cards = [fire, ...TestUtils.makeTestCards(3)];
    const choose = play();
    sim.dispatch(new ResolvePromptAction(choose.id, [fire]));
    resolveShow();
    expect(player.hand.cards).toEqual([fire]);
    expect(player.active.energies.cards).toEqual([]);
  });
});
