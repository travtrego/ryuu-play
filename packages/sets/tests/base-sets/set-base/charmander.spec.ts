import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Charmander } from '../../../src/base-sets/set-base/charmander';
import { TestUtils } from '../../test-utils';

describe('Charmander BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Charmander()],
      [CardType.FIRE, CardType.COLORLESS],
    );
  });

  // Scratch (10)
  it('Should use Scratch', () => {
    const { opponent, player } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Scratch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(player.active.energies.cards.length).toEqual(2);
  });

  // Ember (30) - Discard 1 R Energy card attached to Charmander in order to use this attack.
  it('Should use Ember - discards 1 Fire Energy', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Ember'));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose energy',
      playerId: player.id,
      message: GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
      cost: [CardType.FIRE],
      options: jasmine.objectContaining({ allowCancel: false })
    }));

    const fire = player.active.energies.cards[0];
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [{ card: fire, provides: [CardType.FIRE], provideAmount: 1 }]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(player.active.energies.cards).toEqual(TestUtils.makeEnergies([CardType.COLORLESS]));
    expect(player.discard.cards).toEqual([fire]);
  });

});
