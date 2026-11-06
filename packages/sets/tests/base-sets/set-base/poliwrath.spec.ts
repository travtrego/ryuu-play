import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Poliwrath } from '../../../src/base-sets/set-base/poliwrath';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Poliwrath BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  // Water Gun (30+) - Does 30 damage plus 10 more damage for each W Energy attached to Poliwrath but not used to
  // pay for this attack's Energy cost. Extra W Energy after the 2nd doesn't count.
  it('Should use Water Gun for 30 damage when all Water Energy pays the cost', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Poliwrath()], [CardType.WATER, CardType.WATER, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Water Gun for 40 damage with 1 extra Water Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Poliwrath()], [CardType.WATER, CardType.WATER, CardType.WATER, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Water Gun for 50 damage with 2 extra Water Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Poliwrath()],
      [CardType.WATER, CardType.WATER, CardType.COLORLESS, CardType.WATER, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(opponent.active.damage).toEqual(50);
  });

  it('Should use Water Gun and ignore extra Water Energy after the 2nd', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Poliwrath()],
      [CardType.WATER, CardType.WATER, CardType.COLORLESS, CardType.WATER, CardType.WATER, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(opponent.active.damage).toEqual(50);
  });

  // Whirlpool (40) - If the Defending Pokémon has any Energy cards attached to it, choose 1 of them and discard it.
  it('Should use Whirlpool and discard the chosen Energy card from the Defending Pokémon', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Poliwrath()], [CardType.WATER, CardType.WATER, CardType.COLORLESS, CardType.COLORLESS]);
    TestUtils.setDefending(sim, [new TestPokemon()], [CardType.FIRE, CardType.GRASS]);
    const grass = opponent.active.energies.cards[1];

    sim.dispatch(new AttackAction(1, 'Whirlpool'));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_DISCARD,
      cards: opponent.active.energies,
      options: jasmine.objectContaining({ min: 1, max: 1, allowCancel: false })
    }));

    sim.dispatch(new ResolvePromptAction(prompts[0].id, [grass]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
    expect(opponent.active.energies.cards).toEqual(TestUtils.makeEnergies([CardType.FIRE]));
    expect(opponent.discard.cards).toEqual([grass]);
  });

  it('Should use Whirlpool without a prompt when the Defending Pokémon has no Energy', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Poliwrath()], [CardType.WATER, CardType.WATER, CardType.COLORLESS, CardType.COLORLESS]);

    sim.dispatch(new AttackAction(1, 'Whirlpool'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });
});
