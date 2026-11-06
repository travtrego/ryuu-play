import {
  AttackAction,
  CardType,
  ChooseEnergyPrompt,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Flareon } from '../../../src/ex-sets/set-sandstorm/flareon';
import { TestUtils } from '../../test-utils';

describe('Flareon SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Flareon()],
      [CardType.FIRE, CardType.FIRE, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  // Super Singe (20) - Flip a coin. If heads, the Defending Pokémon is now Burned.
  it('Should use Super Singe - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Super Singe'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.BURNED]);
  });

  it('Should use Super Singe - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Super Singe'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Flamethrower (70) - Discard a R Energy card attached to Flareon.
  it('Should use Flamethrower and discard a Fire Energy', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const fire = player.active.energies.cards[0];

    sim.dispatch(new AttackAction(1, 'Flamethrower'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose energy',
      playerId: player.id,
      message: GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
      cost: [CardType.FIRE],
      options: jasmine.objectContaining({ allowCancel: false })
    }));
    const prompt = prompts[0] as ChooseEnergyPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [prompt.energy[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(70);
    expect(player.discard.cards).toEqual([fire]);
    expect(player.active.energies.cards).toEqual(
      TestUtils.makeEnergies([CardType.FIRE, CardType.COLORLESS, CardType.COLORLESS]));
  });
});
