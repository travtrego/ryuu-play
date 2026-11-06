import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Electrike } from '../../../src/ex-sets/set-ruby-and-sapphire/electrike';
import { LightningEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/lightning-energy';
import { WaterEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/water-energy';
import { TestUtils } from '../../test-utils';

describe('Electrike RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Electrike()], [CardType.LIGHTNING, CardType.COLORLESS]);
  });

  // Charge - Attach a L Energy card from your discard pile to Electrike.
  it('Should use Charge - attach Lightning Energy from discard', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const water = new WaterEnergy();
    const lightning = new LightningEnergy();
    player.discard.cards = [water, lightning];

    sim.dispatch(new AttackAction(1, 'Charge'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(player.active.energies.cards).toContain(lightning);
    expect(player.discard.cards).toEqual([water]);
  });

  it('Should use Charge - no Lightning Energy in discard', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.discard.cards = [new WaterEnergy()];

    sim.dispatch(new AttackAction(1, 'Charge'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.energies.cards.length).toEqual(2);
  });

  // Thunder Jolt (30) - Flip a coin. If tails, Electrike does 10 damage to itself.
  it('Should use Thunder Jolt - heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Thunder Jolt'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Thunder Jolt - tails', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Thunder Jolt'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(player.active.damage).toEqual(10);
  });

});
