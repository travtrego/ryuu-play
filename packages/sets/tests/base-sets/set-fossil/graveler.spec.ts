import {
  AttackAction,
  CardType,
  PassTurnAction,
  PokemonCard,
  Simulator,
} from '@ptcg/common';

import { Graveler } from '../../../src/base-sets/set-fossil/graveler';
import { TestUtils } from '../../test-utils';

describe('Graveler FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Graveler()],
      [CardType.FIGHTING, CardType.FIGHTING, CardType.COLORLESS]
    );
  });

  function opponentAttacks(damage: number, cardTypes: CardType[] = []) {
    const { opponent } = TestUtils.getAll(sim);
    const attacker = opponent.active.getPokemonCard() as PokemonCard;
    attacker.attacks[0].damage = String(damage);
    attacker.cardTypes = cardTypes;
    sim.dispatch(new AttackAction(2, 'Test attack'));
  }

  // Harden - During your opponent's next turn, whenever 30 or less damage is done to Graveler (after applying
  // Weakness and Resistance), prevent that damage. (Any other effects of attacks still happen.)
  it('Should use Harden and prevent 30 damage', () => {
    const { opponent, player } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Harden'));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);

    opponentAttacks(30);

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Harden and not prevent 40 damage', () => {
    const { player } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Harden'));
    opponentAttacks(40);

    expect(player.active.damage).toEqual(40);
  });

  it('Should use Harden - damage is checked after Weakness', () => {
    const { player } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Harden'));
    // 20 Grass damage doubled by Graveler's Grass Weakness = 40
    opponentAttacks(20, [CardType.GRASS]);

    expect(player.active.damage).toEqual(40);
  });

  it('Should use Harden - the effect ends after the opponent\'s next turn', () => {
    const { player } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Harden'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    opponentAttacks(30);

    expect(player.active.damage).toEqual(30);
  });

  // Rock Throw (40)
  it('Should use Rock Throw', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Rock Throw'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });
});
