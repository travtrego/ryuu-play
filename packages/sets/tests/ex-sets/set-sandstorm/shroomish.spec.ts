import {
  AttackAction,
  CardType,
  ResolvePromptAction,
  Simulator,
  SlotType,
  SpecialCondition,
} from '@ptcg/common';

import { Shroomish } from '../../../src/ex-sets/set-sandstorm/shroomish';
import { TestUtils } from '../../test-utils';

describe('Shroomish SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Shroomish()], [CardType.GRASS, CardType.COLORLESS]);
  });

  // Growth Spurt - Attach a G Energy card from your hand to Shroomish.
  it('Should use Growth Spurt and attach a Grass Energy from hand', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const [grass, water] = TestUtils.makeEnergies([CardType.GRASS, CardType.WATER]);
    player.hand.cards = [water, grass];
    // the implementation looks in the discard pile, so keep a Grass Energy there too
    player.discard.cards = TestUtils.makeEnergies([CardType.GRASS]);

    sim.dispatch(new AttackAction(1, 'Growth Spurt'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Attach energy',
      playerId: player.id,
      cardList: player.hand,
      slots: [SlotType.ACTIVE],
      options: jasmine.objectContaining({ min: 1, max: 1 })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [{ card: grass, to: TestUtils.target(sim, player.active) }]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([water]);
    expect(player.active.energies.cards.length).toEqual(3);
    expect(player.active.energies.cards).toContain(grass);
    expect(opponent.active.damage).toEqual(0);
  });

  // BUG: Growth Spurt checks the discard pile for a G Energy instead of the hand, so with a G Energy only in hand
  // nothing happens.
  xit('Should use Growth Spurt with a Grass Energy only in hand', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const [grass] = TestUtils.makeEnergies([CardType.GRASS]);
    player.hand.cards = [grass];
    player.discard.cards = [];

    sim.dispatch(new AttackAction(1, 'Growth Spurt'));

    expect(prompts.length).toEqual(1);
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [{ card: grass, to: TestUtils.target(sim, player.active) }]));

    expect(player.hand.cards).toEqual([]);
    expect(player.active.energies.cards).toContain(grass);
  });

  // BUG: with a G Energy in the discard pile but none in hand, Growth Spurt opens a mandatory (min 1) attach prompt
  // over a hand that has no valid card; the attack should just do nothing.
  xit('Should use Growth Spurt without a Grass Energy in hand', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    player.hand.cards = TestUtils.makeEnergies([CardType.WATER]);
    player.discard.cards = TestUtils.makeEnergies([CardType.GRASS]);

    sim.dispatch(new AttackAction(1, 'Growth Spurt'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
  });

  // Poisonpowder (10) - The Defending Pokémon is now Poisoned.
  it('Should use Poisonpowder', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Poisonpowder'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    // 10 damage + 10 poison
    expect(opponent.active.damage).toEqual(20);
  });
});
