import {
  AttackAction,
  CardType,
  PassTurnAction,
  PokemonCard,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Cascoon } from '../../../src/ex-sets/set-ruby-and-sapphire/cascoon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Cascoon RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Cascoon()], [CardType.GRASS]);

    const { opponent } = TestUtils.getAll(sim);
    const attacker = opponent.active.getPokemonCard() as PokemonCard;
    attacker.attacks = [
      { name: 'Big attack', cost: [], damage: '50', text: '' },
      { name: 'Growl', cost: [], damage: '', text: '' },
    ];
  });

  // Hard Cocoon - During your opponent's turn, if Cascoon would be damaged by an opponent's attack (after applying
  // Weakness and Resistance), flip a coin. If heads, reduce that damage by 30.
  it('Should use Hard Cocoon - heads', () => {
    const { player } = TestUtils.getAll(sim);

    sim.dispatch(new PassTurnAction(1));
    TestUtils.setFlipResults(sim, [true]);
    sim.dispatch(new AttackAction(2, 'Big attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(20);
  });

  it('Should use Hard Cocoon - tails', () => {
    const { player } = TestUtils.getAll(sim);

    sim.dispatch(new PassTurnAction(1));
    TestUtils.setFlipResults(sim, [false]);
    sim.dispatch(new AttackAction(2, 'Big attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(50);
  });

  it('Should use Hard Cocoon - after applying Weakness', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const attacker = opponent.active.getPokemonCard() as PokemonCard;
    attacker.cardTypes = [CardType.FIRE];
    attacker.attacks = [{ name: 'Fire attack', cost: [], damage: '30', text: '' }];

    sim.dispatch(new PassTurnAction(1));
    TestUtils.setFlipResults(sim, [true]);
    sim.dispatch(new AttackAction(2, 'Fire attack'));

    // 30 x2 - 30
    expect(player.active.damage).toEqual(30);
  });

  it('Should use Hard Cocoon - power blocked', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    sim.dispatch(new PassTurnAction(1));
    TestUtils.setFlipResults(sim, [true]);
    sim.dispatch(new AttackAction(2, 'Big attack'));

    expect(player.active.damage).toEqual(50);
  });

  it('Should use Hard Cocoon - heads on a non-damaging attack does not carry over', () => {
    const { player } = TestUtils.getAll(sim);

    sim.dispatch(new PassTurnAction(1));
    TestUtils.setFlipResults(sim, [true]);
    sim.dispatch(new AttackAction(2, 'Growl'));

    sim.dispatch(new PassTurnAction(1));
    TestUtils.setFlipResults(sim, [false]);
    sim.dispatch(new AttackAction(2, 'Big attack'));

    expect(player.active.damage).toEqual(50);
  });

  // Poison Thread - The Defending Pokémon is now Poisoned.
  it('Should use Poison Thread', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Poison Thread'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    // Poison applied between turns
    expect(opponent.active.damage).toEqual(10);
  });

});
