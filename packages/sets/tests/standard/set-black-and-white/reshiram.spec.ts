import {
  AttackAction,
  CardType,
  ChooseEnergyPrompt,
  GameMessage,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Reshiram } from '../../../src/standard/set-black-and-white/reshiram';
import { TestUtils } from '../../test-utils';

describe('Reshiram BW', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Reshiram()],
      [CardType.FIRE, CardType.FIRE, CardType.COLORLESS]
    );
  });

  // Outrage (20+) - Does 10 more damage for each damage counter on this Pokemon.
  it('Should use Outrage for 20 with no damage counters', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Outrage'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Outrage and add 10 damage per damage counter', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.damage = 50;

    sim.dispatch(new AttackAction(1, 'Outrage'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(70);
    expect(player.active.damage).toEqual(50);
  });

  // Blue Flare (120) - Discard 2 R Energy attached to this Pokemon.
  it('Should use Blue Flare and discard 2 Fire Energy', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Blue Flare'));

    const energyPrompt = prompts[0] as ChooseEnergyPrompt;
    expect(energyPrompt).toEqual(jasmine.objectContaining({
      type: 'Choose energy',
      playerId: player.id,
      message: GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
      cost: [CardType.FIRE, CardType.FIRE],
    }));
    sim.dispatch(new ResolvePromptAction(
      energyPrompt.id,
      [energyPrompt.energy[0], energyPrompt.energy[1]]
    ));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(120);
    expect(player.active.energies.cards.length).toEqual(1);
    expect(player.discard.cards.length).toEqual(2);
  });
});
