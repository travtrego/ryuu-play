import {
  AttackAction,
  CardType,
  PlayCardAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Cacnea2 } from '../../../src/ex-sets/set-sandstorm/cacnea-2';
import { Seviper } from '../../../src/ex-sets/set-sandstorm/seviper';
import { Zangoose } from '../../../src/ex-sets/set-sandstorm/zangoose';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Zangoose SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Zangoose()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  // Poison Resistance - Zangoose can't be Poisoned.
  it('Should not be Poisoned by an opponent\'s attack', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new Cacnea2()], [CardType.GRASS]);
    TestUtils.setActivePlayer(sim, opponent);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(2, 'Poison Sting'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.specialConditions).toEqual([]);
    // only the attack damage, no poison damage between turns
    expect(player.active.damage).toEqual(10);
  });

  it('Should remove Poisoned but keep other Special Conditions', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.addSpecialCondition(SpecialCondition.POISONED);
    player.active.addSpecialCondition(SpecialCondition.CONFUSED);
    player.hand.cards = [new TestPokemon()];

    // any action triggers the table state check
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.bench[0])));

    expect(player.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
  });

  it('Should be Poisoned when Poison Resistance is blocked', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.addSpecialCondition(SpecialCondition.POISONED);
    player.bench[1] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);
    player.hand.cards = [new TestPokemon()];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.bench[0])));

    expect(player.active.specialConditions).toEqual([SpecialCondition.POISONED]);
  });

  // Target Slash (10+) - If the Defending Pokémon is Seviper, this attack does 10 damage plus 30 more damage.
  it('Should use Target Slash against Seviper', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new Seviper()]);

    sim.dispatch(new AttackAction(1, 'Target Slash'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Target Slash against another Pokémon', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Target Slash'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  // Super Slash (30+) - If the Defending Pokémon is an Evolved Pokémon, this attack does 30 damage plus 30 more
  // damage.
  it('Should use Super Slash against an Evolved Pokémon', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestPokemon(), new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Super Slash'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Super Slash against a Basic Pokémon', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Super Slash'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });
});
