import {
  AttackAction,
  CardType,
  PassTurnAction,
  PokemonCard,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Grimer } from '../../../src/base-sets/set-fossil/grimer';
import { TestUtils } from '../../test-utils';

describe('Grimer FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Grimer()],
      [CardType.GRASS]
    );
  });

  function opponentAttacks(damage: number, cardTypes: CardType[] = []) {
    const { opponent } = TestUtils.getAll(sim);
    const attacker = opponent.active.getPokemonCard() as PokemonCard;
    attacker.attacks[0].damage = String(damage);
    attacker.cardTypes = cardTypes;
    sim.dispatch(new AttackAction(2, 'Test attack'));
  }

  // Nasty Goo (10) - Flip a coin. If heads, the Defending Pokémon is now Paralyzed.
  it('Should use Nasty Goo - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Nasty Goo'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Nasty Goo - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Nasty Goo'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Minimize - All damage done by attacks to Grimer during your opponent's next turn is reduced by 20 (after
  // applying Weakness and Resistance).
  it('Should use Minimize and reduce damage by 20', () => {
    const { opponent, player } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Minimize'));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);

    opponentAttacks(50);

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(30);
  });

  it('Should use Minimize - reduction after Weakness', () => {
    const { player } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Minimize'));
    // 30 Psychic damage doubled by Grimer's Psychic Weakness = 60, minus 20
    opponentAttacks(30, [CardType.PSYCHIC]);

    expect(player.active.damage).toEqual(40);
  });

  it('Should use Minimize - small damage is reduced to 0', () => {
    const { player } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Minimize'));
    opponentAttacks(10);

    expect(player.active.damage).toEqual(0);
  });

  it('Should use Minimize - the effect ends after the opponent\'s next turn', () => {
    const { player } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Minimize'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    opponentAttacks(40);

    expect(player.active.damage).toEqual(40);
  });
});
