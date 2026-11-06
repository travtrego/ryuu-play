import {
  AttackAction,
  CardType,
  GameMessage,
  PassTurnAction,
  PokemonCard,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Poliwhirl } from '../../../src/base-sets/set-base/poliwhirl';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class TwoAttackPokemon extends TestPokemon {
  public attacks = [
    { name: 'Attack A', cost: [], damage: '10', text: '' },
    { name: 'Attack B', cost: [], damage: '20', text: '' },
  ];
}

describe('Poliwhirl BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Poliwhirl()],
      [CardType.WATER, CardType.WATER, CardType.COLORLESS],
    );
    TestUtils.setDefending(sim, [new TwoAttackPokemon()]);
  });

  // Amnesia - Choose 1 of the Defending Pokémon's attacks. That Pokémon can't use that attack during your
  // opponent's next turn.
  it('Should use Amnesia and block the chosen attack during the opponent\'s next turn', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard() as PokemonCard;

    sim.dispatch(new AttackAction(1, 'Amnesia'));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose attack',
      playerId: player.id,
      message: GameMessage.CHOOSE_ATTACK_TO_DISABLE,
      cards: [defending],
    }));

    sim.dispatch(new ResolvePromptAction(prompts[0].id, defending.attacks[0]));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);

    let message = '';
    try {
      sim.dispatch(new AttackAction(2, 'Attack A'));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.BLOCKED_BY_EFFECT);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Amnesia and still allow the other attack', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard() as PokemonCard;

    sim.dispatch(new AttackAction(1, 'Amnesia'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, defending.attacks[0]));

    sim.dispatch(new AttackAction(2, 'Attack B'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(20);
  });

  it('Should use Amnesia and allow the attack again after the opponent\'s next turn', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard() as PokemonCard;

    sim.dispatch(new AttackAction(1, 'Amnesia'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, defending.attacks[0]));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();

    sim.dispatch(new AttackAction(2, 'Attack A'));

    expect(player.active.damage).toEqual(10);
  });

  // Doubleslap (30x) - Flip 2 coins. This attack does 30 damage times the number of heads.
  it('Should use Doubleslap for 60 damage on 2 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Doubleslap'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Doubleslap for 30 damage on 1 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, false]);

    sim.dispatch(new AttackAction(1, 'Doubleslap'));

    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Doubleslap for 0 damage on 2 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false]);

    sim.dispatch(new AttackAction(1, 'Doubleslap'));

    expect(opponent.active.damage).toEqual(0);
  });
});
