import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Kadabra } from '../../../src/base-sets/set-base/kadabra';
import { TestUtils } from '../../test-utils';

describe('Kadabra BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Kadabra()],
      [CardType.PSYCHIC, CardType.PSYCHIC, CardType.COLORLESS],
    );
  });

  // Recover - Discard 1 P Energy card attached to Kadabra in order to use this attack. Remove all damage
  // counters from Kadabra.
  it('Should use Recover - discard Psychic Energy and remove all damage counters', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    player.active.damage = 50;

    sim.dispatch(new AttackAction(1, 'Recover'));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose energy',
      playerId: player.id,
      message: GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
      cost: [CardType.PSYCHIC],
      options: jasmine.objectContaining({ allowCancel: false })
    }));

    const psychic = player.active.energies.cards[0];
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [{ card: psychic, provides: [CardType.PSYCHIC], provideAmount: 1 }]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.damage).toEqual(0);
    expect(player.active.energies.cards).toEqual(TestUtils.makeEnergies([CardType.PSYCHIC, CardType.COLORLESS]));
    expect(player.discard.cards).toEqual([psychic]);
    expect(opponent.active.damage).toEqual(0);
  });

  // Super Psy (50)
  it('Should use Super Psy', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Super Psy'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
  });

});
