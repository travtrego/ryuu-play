import {
  AttackAction,
  CardType,
  GameMessage,
  PassTurnAction,
  Simulator,
  SpecialCondition,
  UseAbilityAction,
} from '@ptcg/common';

import { Golduck } from '../../../src/ex-sets/set-sandstorm/golduck';
import { MultiEnergy } from '../../../src/ex-sets/set-sandstorm/multi-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Golduck SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Golduck()], [CardType.WATER, CardType.PSYCHIC]);
  });

  function useChaosFlash(): string {
    const { player } = TestUtils.getAll(sim);
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Chaos Flash', TestUtils.target(sim, player.active)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Chaos Flash - Once during your turn (before your attack), if Golduck is your Active Pokémon, you may flip a
  // coin. If heads, the Defending Pokémon (choose 1 if there are 2) is now Confused. This power can't be used if
  // Golduck is affected by a Special Condition.
  it('Should use Chaos Flash - heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    expect(useChaosFlash()).toEqual('');

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
  });

  it('Should use Chaos Flash - tails', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    expect(useChaosFlash()).toEqual('');

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([]);
  });

  it('Should use Chaos Flash only once per turn', () => {
    TestUtils.setFlipResults(sim, [false]);

    expect(useChaosFlash()).toEqual('');
    expect(useChaosFlash()).toEqual(GameMessage.POWER_ALREADY_USED);
  });

  it('Should use Chaos Flash again during the next turn', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    expect(useChaosFlash()).toEqual('');
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new PassTurnAction(2));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(useChaosFlash()).toEqual('');
    expect(opponent).toBeDefined();
  });

  it('Should not use Chaos Flash when Golduck is on the Bench', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TestPokemon()]);
    player.bench[0] = TestUtils.pokemonSlot([new Golduck()]);

    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Chaos Flash', TestUtils.target(sim, player.bench[0])));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  it('Should not use Chaos Flash when Golduck is affected by a Special Condition', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.addSpecialCondition(SpecialCondition.POISONED);

    expect(useChaosFlash()).toEqual(GameMessage.CANNOT_USE_POWER);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Special Blow (30+) - If the Defending Pokémon has any Special Energy cards attached to it, this attack does 30
  // damage plus 40 more damage.
  it('Should use Special Blow against a Defending Pokémon without Special Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestPokemon()], [CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Special Blow'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Special Blow against a Defending Pokémon with Special Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.active.energies.cards = [new MultiEnergy()];

    sim.dispatch(new AttackAction(1, 'Special Blow'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(70);
  });
});
