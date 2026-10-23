import {
  AttackAction,
  CardType,
  ChooseEnergyPrompt,
  GameMessage,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Torchic } from '../../../src/ex-sets/set-ruby-and-sapphire/torchic';
import { TestUtils } from '../../test-utils';

describe('Torchic RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Torchic()], [CardType.FIRE, CardType.FIRE]);
  });

  // Peck (10)
  it('Should use Peck', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Peck'));

    expect(opponent.active.damage).toEqual(10);
  });

  // Fireworks (30) - Flip a coin. If tails, discard a R Energy card attached to Torchic.
  it('Should use Fireworks - heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Fireworks'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(player.active.energies.cards.length).toEqual(2);
  });

  it('Should use Fireworks - tails', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);
    const fire = player.active.energies.cards[0];

    sim.dispatch(new AttackAction(1, 'Fireworks'));

    const prompt = TestUtils.lastPrompt(sim) as ChooseEnergyPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose energy',
      playerId: player.id,
      message: GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
      cost: [CardType.FIRE],
      options: jasmine.objectContaining({ allowCancel: false }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, prompt.energy.filter(e => e.card === fire)));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(player.active.energies.cards.length).toEqual(1);
    expect(player.discard.cards).toEqual([fire]);
  });

});
