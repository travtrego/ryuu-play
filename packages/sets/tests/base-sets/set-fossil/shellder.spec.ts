import {
  AttackAction,
  CardType,
  PassTurnAction,
  PokemonCard,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Shellder } from '../../../src/base-sets/set-fossil/shellder';
import { Ekans } from '../../../src/base-sets/set-fossil/ekans';
import { TestUtils } from '../../test-utils';

describe('Shellder FO', () => {
  let sim: Simulator;
  let shellder: Shellder;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    shellder = new Shellder();
    shellder.hp = 400; // keep it in play to measure damage

    TestUtils.setActive(
      sim,
      [shellder],
      [CardType.WATER]
    );
  });

  function opponentAttacks(damage: number) {
    const { opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as PokemonCard).attacks[0].damage = String(damage);
    sim.dispatch(new AttackAction(2, 'Test attack'));
  }

  // Supersonic - Flip a coin. If heads, the Defending Pokémon is now Confused.
  it('Should use Supersonic - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Supersonic'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
  });

  it('Should use Supersonic - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Supersonic'));

    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Hide in Shell - Flip a coin. If heads, prevent all damage done to Shellder during your opponent's next turn.
  // (Any other effects of attacks still happen.)
  it('Should use Hide in Shell - heads prevents damage', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Hide in Shell'));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);

    opponentAttacks(50);

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Hide in Shell - heads, other effects still happen', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new Ekans()], [CardType.GRASS, CardType.COLORLESS]);
    // Hide in Shell heads, Wrap heads
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Hide in Shell'));
    sim.dispatch(new AttackAction(2, 'Wrap'));

    expect(player.active.damage).toEqual(0);
    expect(player.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Hide in Shell - tails', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Hide in Shell'));
    opponentAttacks(50);

    expect(player.active.damage).toEqual(50);
  });

  it('Should use Hide in Shell - the effect ends after the opponent\'s next turn', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Hide in Shell'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    opponentAttacks(50);

    expect(player.active.damage).toEqual(50);
  });
});
