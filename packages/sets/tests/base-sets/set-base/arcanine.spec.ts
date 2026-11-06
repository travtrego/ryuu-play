import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Arcanine } from '../../../src/base-sets/set-base/arcanine';
import { TestUtils } from '../../test-utils';

describe('Arcanine BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Arcanine()],
      [CardType.FIRE, CardType.FIRE, CardType.COLORLESS],
    );
  });

  // Take Down (80) - Arcanine does 30 damage to itself.
  it('Should use Take Down', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setActive(
      sim,
      [new Arcanine()],
      [CardType.FIRE, CardType.FIRE, CardType.COLORLESS, CardType.COLORLESS],
    );

    sim.dispatch(new AttackAction(1, 'Take Down'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(80);
    expect(player.active.damage).toEqual(30);
  });

  // Flamethrower (50) - Discard 1 R Energy card attached to Arcanine in order to use this attack.
  it('Should use Flamethrower - discards 1 Fire Energy', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Flamethrower'));

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
    expect(opponent.active.damage).toEqual(50);
    expect(player.active.energies.cards).toEqual(TestUtils.makeEnergies([CardType.FIRE, CardType.COLORLESS]));
    expect(player.discard.cards).toEqual([fire]);
  });

});
