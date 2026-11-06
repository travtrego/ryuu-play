import {
  AttackAction,
  CardType,
  PassTurnAction,
  PokemonCard,
  Simulator,
} from '@ptcg/common';

import { Seadra } from '../../../src/base-sets/set-fossil/seadra';
import { Ekans } from '../../../src/base-sets/set-fossil/ekans';
import { TestUtils } from '../../test-utils';

describe('Seadra FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Seadra()],
      [CardType.WATER, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  function opponentAttacks(damage: number) {
    const { opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as PokemonCard).attacks[0].damage = String(damage);
    sim.dispatch(new AttackAction(2, 'Test attack'));
  }

  // Water Gun (20+) - Does 20 damage plus 10 more damage for each W Energy attached to Seadra but not used to pay
  // for this attack's Energy cost. You can't add more than 20 damage in this way.
  it('Should use Water Gun - 1 extra Water Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Seadra()], [CardType.WATER, CardType.WATER, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Water Gun - capped at 20 extra damage', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Seadra()],
      [CardType.WATER, CardType.WATER, CardType.WATER, CardType.WATER, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Water Gun - no extra Water Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Seadra()], [CardType.WATER, CardType.FIRE, CardType.FIRE]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(opponent.active.damage).toEqual(20);
  });

  // Agility (20) - Flip a coin. If heads, during your opponent's next turn, prevent all effects of attacks,
  // including damage, done to Seadra.
  it('Should use Agility - heads prevents damage', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Agility'));
    expect(opponent.active.damage).toEqual(20);

    opponentAttacks(50);

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Agility - heads prevents other effects', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new Ekans()], [CardType.GRASS, CardType.COLORLESS]);
    // Agility heads, Wrap heads
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Agility'));
    sim.dispatch(new AttackAction(2, 'Wrap'));

    expect(player.active.damage).toEqual(0);
    expect(player.active.specialConditions).toEqual([]);
  });

  it('Should use Agility - tails', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Agility'));
    opponentAttacks(50);

    expect(player.active.damage).toEqual(50);
  });

  it('Should use Agility - the effect ends after the opponent\'s next turn', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Agility'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    opponentAttacks(50);

    expect(player.active.damage).toEqual(50);
  });
});
