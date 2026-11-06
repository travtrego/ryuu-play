import {
  AttackAction,
  CardType,
  ChooseEnergyPrompt,
  GameMessage,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Flareon } from '../../../src/base-sets/set-jungle/flareon';
import { TestUtils } from '../../test-utils';

describe('Flareon JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Flareon()],
      [CardType.FIRE, CardType.FIRE, CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  // Quick Attack (10+) - Flip a coin. If heads, this attack does 10 damage plus 20 more damage; if tails, this
  // attack does 10 damage.
  it('Should use Quick Attack - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Quick Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Quick Attack - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Quick Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  // Flamethrower (60) - Discard 1 R Energy card attached to Flareon in order to use this attack.
  it('Should use Flamethrower and discard 1 Fire Energy', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    const energies = player.active.energies.cards.slice();

    sim.dispatch(new AttackAction(1, 'Flamethrower'));

    const prompt = prompts[0] as ChooseEnergyPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose energy',
      playerId: player.id,
      message: GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
      cost: [CardType.FIRE],
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [prompt.energy[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
    expect(player.discard.cards).toEqual([energies[0]]);
    expect(player.active.energies.cards).toEqual(energies.slice(1));
  });

  it('Should not discard a non-Fire Energy for Flamethrower', () => {
    const { prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Flamethrower'));

    const prompt = prompts[0] as ChooseEnergyPrompt;
    expect(prompt.validate([prompt.energy[2]])).toBeFalse();
    expect(prompt.validate([prompt.energy[1]])).toBeTrue();
  });
});
