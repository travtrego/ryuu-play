import {
  AttackAction,
  CardType,
  PassTurnAction,
  Simulator,
} from '@ptcg/common';

import { Onix } from '../../../src/base-sets/set-base/onix';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class AttackerPokemon extends TestPokemon {
  public attacks = [
    { name: 'Attack 30', cost: [], damage: '30', text: '' },
    { name: 'Attack 40', cost: [], damage: '40', text: '' },
  ];
}

// Grass attacker: Onix is weak to Grass (x2 in Base Set).
class GrassAttackerPokemon extends AttackerPokemon {
  public cardTypes = [CardType.GRASS];
  public attacks = [
    { name: 'Attack 20', cost: [], damage: '20', text: '' },
    { name: 'Attack 10', cost: [], damage: '10', text: '' },
  ];
}

describe('Onix BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Onix()],
      [CardType.FIGHTING, CardType.FIGHTING],
    );
  });

  it('Should use Rock Throw', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Rock Throw'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  // Harden - During your opponent's next turn, whenever 30 or less damage is done to Onix (after applying
  // Weakness and Resistance), prevent that damage.
  it('Should use Harden and prevent 30 damage during the opponent\'s next turn', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new AttackerPokemon()]);

    sim.dispatch(new AttackAction(1, 'Harden'));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);

    sim.dispatch(new AttackAction(2, 'Attack 30'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Harden and not prevent 40 damage', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new AttackerPokemon()]);

    sim.dispatch(new AttackAction(1, 'Harden'));
    sim.dispatch(new AttackAction(2, 'Attack 40'));

    expect(player.active.damage).toEqual(40);
  });

  it('Should use Harden and check damage after applying Weakness', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new GrassAttackerPokemon()]);

    sim.dispatch(new AttackAction(1, 'Harden'));
    // 20 x2 Weakness = 40, not prevented
    sim.dispatch(new AttackAction(2, 'Attack 20'));

    expect(player.active.damage).toEqual(40);
  });

  it('Should use Harden and prevent damage that is 30 or less after Weakness', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new GrassAttackerPokemon()]);

    sim.dispatch(new AttackAction(1, 'Harden'));
    // 10 x2 Weakness = 20, prevented
    sim.dispatch(new AttackAction(2, 'Attack 10'));

    expect(player.active.damage).toEqual(0);
  });

  it('Should stop Harden after the opponent\'s next turn', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new AttackerPokemon()]);

    sim.dispatch(new AttackAction(1, 'Harden'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Attack 30'));

    expect(player.active.damage).toEqual(30);
  });
});
