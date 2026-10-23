import {
  AttackAction,
  CardType,
  PlayCardAction,
  PokemonCard,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { FireEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/fire-energy';
import { Marshtomp2 } from '../../../src/ex-sets/set-ruby-and-sapphire/marshtomp-2';
import { WaterEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/water-energy';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Marshtomp RS 2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Marshtomp2()], [CardType.COLORLESS, CardType.COLORLESS]);
    sim.store.state.turn = 3;
  });

  // Natural Cure - When you attach a W Energy card from your hand to Marshtomp, remove all Special Conditions from
  // Marshtomp.
  it('Should use Natural Cure - attach Water Energy', () => {
    const { player } = TestUtils.getAll(sim);
    const water = new WaterEnergy();
    player.hand.cards = [water];
    player.active.addSpecialCondition(SpecialCondition.PARALYZED);
    player.active.addSpecialCondition(SpecialCondition.POISONED);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.energies.cards).toContain(water);
    expect(player.active.specialConditions).toEqual([]);
  });

  it('Should use Natural Cure - other Energy does not cure', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [new FireEnergy()];
    player.active.addSpecialCondition(SpecialCondition.POISONED);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect(player.active.specialConditions).toEqual([SpecialCondition.POISONED]);
  });

  it('Should use Natural Cure - power blocked', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [new WaterEnergy()];
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);
    player.active.addSpecialCondition(SpecialCondition.POISONED);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect(player.active.specialConditions).toEqual([SpecialCondition.POISONED]);
  });

  // Aqua Sonic (20) - This attack's damage is not affected by Resistance.
  it('Should use Aqua Sonic - ignores Resistance', () => {
    const { opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as PokemonCard).resistance = [{ type: CardType.WATER, value: -30 }];

    sim.dispatch(new AttackAction(1, 'Aqua Sonic'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Aqua Sonic - Weakness still applied', () => {
    const { opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as PokemonCard).weakness = [{ type: CardType.WATER }];

    sim.dispatch(new AttackAction(1, 'Aqua Sonic'));

    expect(opponent.active.damage).toEqual(40);
  });

});
