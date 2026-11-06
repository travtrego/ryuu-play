import {
  AttackAction,
  CardType,
  PlayCardAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Combusken2 } from '../../../src/ex-sets/set-ruby-and-sapphire/combusken-2';
import { FireEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/fire-energy';
import { WaterEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/water-energy';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Combusken RS 2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Combusken2()], [CardType.COLORLESS, CardType.COLORLESS]);
    sim.store.state.turn = 3;
  });

  // Natural Cure - When you attach a R Energy card from your hand to Combusken, remove all Special Conditions from
  // Combusken.
  it('Should use Natural Cure - attach Fire Energy', () => {
    const { player } = TestUtils.getAll(sim);
    const fire = new FireEnergy();
    player.hand.cards = [fire];
    player.active.addSpecialCondition(SpecialCondition.POISONED);
    player.active.addSpecialCondition(SpecialCondition.CONFUSED);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.energies.cards).toContain(fire);
    expect(player.active.specialConditions).toEqual([]);
  });

  it('Should use Natural Cure - other Energy does not cure', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [new WaterEnergy()];
    player.active.addSpecialCondition(SpecialCondition.POISONED);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect(player.active.specialConditions).toEqual([SpecialCondition.POISONED]);
  });

  it('Should use Natural Cure - power blocked', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [new FireEnergy()];
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);
    player.active.addSpecialCondition(SpecialCondition.POISONED);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect(player.active.specialConditions).toEqual([SpecialCondition.POISONED]);
  });

  // Lunge (50) - Flip a coin. If tails, this attack does nothing.
  it('Should use Lunge - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Lunge'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
  });

  it('Should use Lunge - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Lunge'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

});
