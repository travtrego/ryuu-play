import {
  AttackAction,
  CardType,
  PlayCardAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { GrassEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/grass-energy';
import { Grovyle2 } from '../../../src/ex-sets/set-ruby-and-sapphire/grovyle-2';
import { WaterEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/water-energy';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Grovyle RS 2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Grovyle2()], [CardType.COLORLESS, CardType.COLORLESS]);
    sim.store.state.turn = 3;
  });

  // Natural Cure - When you attach a G Energy card from your hand to Grovyle, remove all Special Conditions from
  // Grovyle.
  it('Should use Natural Cure - attach Grass Energy', () => {
    const { player } = TestUtils.getAll(sim);
    const grass = new GrassEnergy();
    player.hand.cards = [grass];
    player.active.addSpecialCondition(SpecialCondition.BURNED);
    player.active.addSpecialCondition(SpecialCondition.ASLEEP);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.energies.cards).toContain(grass);
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
    player.hand.cards = [new GrassEnergy()];
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);
    player.active.addSpecialCondition(SpecialCondition.POISONED);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect(player.active.specialConditions).toEqual([SpecialCondition.POISONED]);
  });

  // Slash (20)
  it('Should use Slash', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Slash'));

    expect(opponent.active.damage).toEqual(20);
  });

});
