import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Magmar } from '../../../src/base-sets/set-base/magmar';
import { TestUtils } from '../../test-utils';

describe('Magmar BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Magmar()],
      [CardType.FIRE, CardType.FIRE, CardType.COLORLESS],
    );
  });

  it('Should use Fire Punch', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Fire Punch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(player.active.energies.cards.length).toEqual(3);
  });

  // Flamethrower (50) - Discard 1 R Energy card attached to Magmar in order to use this attack.
  it('Should use Flamethrower and discard 1 Fire Energy', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const fireEnergy = player.active.energies.cards[0];

    sim.dispatch(new AttackAction(1, 'Flamethrower'));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose energy',
      playerId: player.id,
      message: GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
      cost: [CardType.FIRE],
      options: jasmine.objectContaining({ allowCancel: false })
    }));

    sim.dispatch(new ResolvePromptAction(prompts[0].id, [{ card: fireEnergy, provides: [CardType.FIRE] }]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
    expect(player.discard.cards).toEqual([fireEnergy]);
    expect(player.active.energies.cards).toEqual(TestUtils.makeEnergies([CardType.FIRE, CardType.COLORLESS]));
  });
});
