import {
  AttackAction,
  CardType,
  ChooseEnergyPrompt,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Seviper } from '../../../src/ex-sets/set-sandstorm/seviper';
import { TestPokemonEx } from '../../test-cards/test-pokemon-ex';
import { TestUtils } from '../../test-utils';

describe('Seviper SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Seviper()], [CardType.GRASS, CardType.COLORLESS]);
  });

  // Deadly Poison (10) - You may discard a G Energy card attached to Seviper. If you do, the Defending Pokémon is
  // now Poisoned.
  it('Should use Deadly Poison and discard a Grass Energy', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const grass = player.active.energies.cards[0];

    sim.dispatch(new AttackAction(1, 'Deadly Poison'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose energy',
      playerId: player.id,
      message: GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
      cost: [CardType.GRASS],
      options: jasmine.objectContaining({ allowCancel: true })
    }));
    const prompt = prompts[0] as ChooseEnergyPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [prompt.energy[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    // 10 damage + 10 poison
    expect(opponent.active.damage).toEqual(20);
    expect(player.discard.cards).toEqual([grass]);
  });

  it('Should use Deadly Poison without discarding', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Deadly Poison'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([]);
    expect(opponent.active.damage).toEqual(10);
    expect(player.active.energies.cards.length).toEqual(2);
  });

  // Extra Poison (20) - If the Defending Pokémon is Pokémon-ex, the Defending Pokémon is now Asleep and Poisoned.
  it('Should use Extra Poison against a Pokémon-ex', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestPokemonEx()]);
    // tails for the Asleep check between turns
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Extra Poison'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual(
      jasmine.arrayWithExactContents([SpecialCondition.ASLEEP, SpecialCondition.POISONED]));
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Extra Poison against a non Pokémon-ex', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Extra Poison'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([]);
    expect(opponent.active.damage).toEqual(20);
  });
});
