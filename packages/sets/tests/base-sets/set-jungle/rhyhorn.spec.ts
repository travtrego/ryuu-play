import {
  AttackAction,
  CardType,
  GameMessage,
  PassTurnAction,
  RetreatAction,
  Simulator,
} from '@ptcg/common';

import { Rhyhorn } from '../../../src/base-sets/set-jungle/rhyhorn';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Rhyhorn JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Rhyhorn()],
      [CardType.FIGHTING, CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  function opponentAttack(): string {
    let message = '';
    try {
      sim.dispatch(new AttackAction(2, 'Test attack'));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Leer - Flip a coin. If heads, the Defending Pokémon can't attack Rhyhorn during your opponent's next turn.
  // (Benching either Pokémon ends this effect.)
  it('Should use Leer - heads, the Defending Pokémon can\'t attack', () => {
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Leer'));
    const message = opponentAttack();

    const { opponent, player } = TestUtils.getAll(sim);
    expect(message).toEqual(GameMessage.BLOCKED_BY_EFFECT);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Leer - tails, the Defending Pokémon can attack', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Leer'));
    const message = opponentAttack();

    expect(message).toEqual('');
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
  });

  it('Should use Leer - a new Active Pokémon can attack', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Leer'));
    sim.dispatch(new RetreatAction(2, 0));
    const message = opponentAttack();

    expect(message).toEqual('');
    expect(player.active.damage).toEqual(10);
  });

  it('Should use Leer - the effect ends after the opponent\'s next turn', () => {
    const { player } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Leer'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    const message = opponentAttack();

    expect(message).toEqual('');
    expect(player.active.damage).toEqual(10);
  });

  // Horn Attack (30)
  it('Should use Horn Attack', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Horn Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });
});
