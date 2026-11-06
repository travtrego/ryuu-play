import {
  AttackAction,
  CardType,
  PassTurnAction,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Terrakion } from '../../../src/standard/set-black-and-white/terrakion';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class BigHitter extends TestPokemon {
  public hp = 300;

  public attacks = [
    { name: 'Big hit', cost: [], damage: '200', text: '' },
  ];
}

describe('Terrakion NV', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Terrakion()],
      [CardType.FIGHTING, CardType.FIGHTING, CardType.COLORLESS]
    );
  });

  // Retaliate (30+) - If any of your Pokemon were Knocked Out by damage from an opponent's attack during his or
  // her last turn, this attack does 60 more damage.
  it('Should use Retaliate for 30 when nothing was Knocked Out', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Retaliate'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  // Knocks out the Active Terrakion, then promotes the Benched one.
  function opponentKnocksOutActive() {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot(
      [new Terrakion()],
      [CardType.FIGHTING, CardType.FIGHTING, CardType.COLORLESS]
    );
    TestUtils.setDefending(sim, [new BigHitter()]);

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Big hit'));

    // Resolve the promotion and the opponent's Prize prompts
    const promote = TestUtils.lastPrompt(sim, player);
    if (promote !== undefined && promote.type === 'Choose pokemon' && promote.result === undefined) {
      sim.dispatch(new ResolvePromptAction(promote.id, [player.bench[0]]));
    }
    const opponent = TestUtils.getAll(sim).opponent;
    const prize = TestUtils.lastPrompt(sim, opponent);
    if (prize !== undefined && prize.type === 'Choose prize' && prize.result === undefined) {
      sim.dispatch(new ResolvePromptAction(prize.id, opponent.prizes.slice(0, 1)));
    }
  }

  it('Should use Retaliate for 90 after one of your Pokemon was Knocked Out last turn', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    opponentKnocksOutActive();
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();

    sim.dispatch(new AttackAction(1, 'Retaliate'));

    expect(opponent.active.damage).toEqual(90);
  });

  it('Should use Retaliate for 30 when the Knock Out was two turns ago', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    opponentKnocksOutActive();
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new PassTurnAction(2));
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();

    sim.dispatch(new AttackAction(1, 'Retaliate'));

    expect(opponent.active.damage).toEqual(30);
  });

  // Land Crush (90)
  it('Should use Land Crush for 90 damage', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Land Crush'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(90);
  });
});
