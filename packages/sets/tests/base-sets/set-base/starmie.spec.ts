import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Starmie } from '../../../src/base-sets/set-base/starmie';
import { TestUtils } from '../../test-utils';

describe('Starmie BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Starmie()],
      [CardType.WATER, CardType.WATER, CardType.COLORLESS],
    );
  });

  // Recover - Discard 1 W Energy card attached to Starmie in order to use this attack. Remove all damage counters
  // from Starmie.
  it('Should use Recover, discard 1 Water Energy and remove all damage counters', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    player.active.damage = 50;
    const energy = player.active.energies.cards[0];

    sim.dispatch(new AttackAction(1, 'Recover'));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose energy',
      playerId: player.id,
      message: GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
      cost: [CardType.WATER],
      options: jasmine.objectContaining({ allowCancel: false })
    }));

    sim.dispatch(new ResolvePromptAction(prompts[0].id, [{ card: energy, provides: [CardType.WATER] }]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.damage).toEqual(0);
    expect(player.discard.cards).toEqual([energy]);
    expect(player.active.energies.cards).toEqual(TestUtils.makeEnergies([CardType.WATER, CardType.COLORLESS]));
    expect(opponent.active.damage).toEqual(0);
  });

  // Star Freeze (20) - Flip a coin. If heads, the Defending Pokémon is now Paralyzed.
  it('Should use Star Freeze and paralyze on heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Star Freeze'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Star Freeze and not paralyze on tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Star Freeze'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([]);
  });
});
