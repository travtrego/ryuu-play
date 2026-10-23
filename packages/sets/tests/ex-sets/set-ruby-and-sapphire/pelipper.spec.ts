import {
  AttackAction,
  CardType,
  PassTurnAction,
  PokemonCard,
  Simulator,
} from '@ptcg/common';

import { Pelipper } from '../../../src/ex-sets/set-ruby-and-sapphire/pelipper';
import { TestUtils } from '../../test-utils';

describe('Pelipper RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Pelipper()], [CardType.WATER, CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Stockpile - During your next turn, Spit Up's base damage is 70 instead of 30, and Swallow's base damage is 60
  // instead of 20.
  it('Should use Stockpile - Spit Up does 70 during next turn', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Stockpile'));
    expect(opponent.active.damage).toEqual(0);

    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new AttackAction(1, 'Spit Up'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(70);
  });

  it('Should use Stockpile - Swallow does 60 during next turn', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Stockpile'));
    sim.dispatch(new PassTurnAction(2));
    player.active.damage = 50;
    sim.dispatch(new AttackAction(1, 'Swallow'));

    expect(opponent.active.damage).toEqual(60);
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Stockpile - effect ends after the next turn', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Stockpile'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new AttackAction(1, 'Spit Up'));

    expect(opponent.active.damage).toEqual(30);
  });

  // BUG: Stockpile sets Pelipper's damage to 0, healing it, which the card text does not say.
  xit('Should use Stockpile - does not remove damage counters from Pelipper', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.damage = 30;

    sim.dispatch(new AttackAction(1, 'Stockpile'));

    expect(player.active.damage).toEqual(30);
  });

  // Spit Up (30)
  it('Should use Spit Up', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Spit Up'));

    expect(opponent.active.damage).toEqual(30);
  });

  // Swallow (20) - After your attack, remove from Pelipper the number of damage counters equal to the damage you did
  // to the Defending Pokémon. If Pelipper has fewer damage counters than that, remove all of them.
  it('Should use Swallow - heal damage done', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.damage = 50;

    sim.dispatch(new AttackAction(1, 'Swallow'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(player.active.damage).toEqual(30);
  });

  it('Should use Swallow - heal damage done after Weakness', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as PokemonCard).weakness = [{ type: CardType.WATER }];
    player.active.damage = 50;

    sim.dispatch(new AttackAction(1, 'Swallow'));

    expect(opponent.active.damage).toEqual(40);
    expect(player.active.damage).toEqual(10);
  });

  it('Should use Swallow - fewer damage counters than damage done', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.damage = 10;

    sim.dispatch(new AttackAction(1, 'Swallow'));

    expect(opponent.active.damage).toEqual(20);
    expect(player.active.damage).toEqual(0);
  });

});
