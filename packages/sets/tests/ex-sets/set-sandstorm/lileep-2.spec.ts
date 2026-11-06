import {
  AttackAction,
  CardType,
  GameMessage,
  PassTurnAction,
  PokemonCard,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Lileep2 } from '../../../src/ex-sets/set-sandstorm/lileep-2';
import { TestUtils } from '../../test-utils';

describe('Lileep SS-2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Lileep2()], [CardType.GRASS, CardType.COLORLESS]);
  });

  // Amnesia - Choose 1 of the Defending Pokémon's attacks. That Pokémon can't use that attack during your
  // opponent's next turn.
  it('Should use Amnesia and block the chosen attack during the opponent\'s next turn', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard() as PokemonCard;

    sim.dispatch(new AttackAction(1, 'Amnesia'));

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
      sim.dispatch(new AttackAction(2, 'Test attack'));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.BLOCKED_BY_EFFECT);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Amnesia - the attack can be used again after the opponent\'s next turn', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard() as PokemonCard;

    sim.dispatch(new AttackAction(1, 'Amnesia'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, defending.attacks[0]));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
  });

  it('Should use Amnesia and cancel', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Amnesia'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
    expect(opponent).toBeDefined();
  });

  // Headbutt (30)
  it('Should use Headbutt', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Headbutt'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });
});
