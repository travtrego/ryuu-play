import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Golduck } from '../../../src/base-sets/set-fossil/golduck';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Golduck FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Golduck()],
      [CardType.WATER, CardType.WATER, CardType.PSYCHIC]
    );
  });

  // Psyshock (10) - Flip a coin. If heads, the Defending Pokémon is now Paralyzed.
  it('Should use Psyshock - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Psyshock'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Psyshock - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Psyshock'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Hyper Beam (20) - If the Defending Pokémon has any Energy cards attached to it, choose 1 of them and discard it.
  it('Should use Hyper Beam and discard an Energy card', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestPokemon()], [CardType.FIRE, CardType.GRASS]);
    const [fire, grass] = opponent.active.energies.cards;

    sim.dispatch(new AttackAction(1, 'Hyper Beam'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_DISCARD,
      cards: opponent.active.energies,
      options: jasmine.objectContaining({ min: 1, max: 1 })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [grass]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.energies.cards).toEqual([fire]);
    expect(opponent.discard.cards).toEqual([grass]);
  });

  it('Should use Hyper Beam without Energy on the Defending Pokémon', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Hyper Beam'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });
});
