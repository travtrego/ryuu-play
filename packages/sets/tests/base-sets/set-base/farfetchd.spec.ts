import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Farfetchd } from '../../../src/base-sets/set-base/farfetchd';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Farfetchd BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Farfetchd()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  // Leek Slap (30) - Flip a coin. If tails, this attack does nothing. Either way, you can't use this attack
  // again as long as Farfetch'd stays in play (even putting Farfetch'd on the Bench won't let you use it again).
  it('Should use Leek Slap - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Leek Slap'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Leek Slap - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Leek Slap'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should not use Leek Slap again while Farfetch\'d stays in play', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Leek Slap'));
    sim.dispatch(new AttackAction(2, 'Test attack'));
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();

    let message = '';
    try {
      sim.dispatch(new AttackAction(1, 'Leek Slap'));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).not.toEqual('');
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should not use Leek Slap again after Farfetch\'d went to the Bench and back', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    const farfetchd = player.active.getPokemonCard() as Farfetchd;
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Leek Slap'));
    sim.dispatch(new AttackAction(2, 'Test attack'));
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();

    // Simulate switching Farfetch'd to the Bench and back to the Active Spot
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.switchPokemon(player.bench[0]);
    expect(player.bench[0].pokemons.cards).toEqual([farfetchd]);
    player.switchPokemon(player.bench[0]);
    expect(player.active.pokemons.cards).toEqual([farfetchd]);

    let message = '';
    try {
      sim.dispatch(new AttackAction(1, 'Leek Slap'));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).not.toEqual('');
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should still use Pot Smash after Leek Slap was used', () => {
    const { opponent, player } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Leek Slap'));
    sim.dispatch(new AttackAction(2, 'Test attack'));
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();

    sim.dispatch(new AttackAction(1, 'Pot Smash'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });

  it('Should allow a different Farfetch\'d to use Leek Slap', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Leek Slap'));
    sim.dispatch(new AttackAction(2, 'Test attack'));
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();

    // Another Farfetch'd becomes the Active Pokémon
    player.bench[0] = TestUtils.pokemonSlot([new Farfetchd()], [CardType.COLORLESS]);
    player.switchPokemon(player.bench[0]);

    sim.dispatch(new AttackAction(1, 'Leek Slap'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });

});
