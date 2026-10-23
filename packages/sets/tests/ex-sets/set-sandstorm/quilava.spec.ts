import {
  AttackAction,
  CardType,
  ChooseEnergyPrompt,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Quilava } from '../../../src/ex-sets/set-sandstorm/quilava';
import { TestUtils } from '../../test-utils';

describe('Quilava SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Quilava()],
      [CardType.FIRE, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  // Slash (20)
  it('Should use Slash', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Slash'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  // Burning Claw (40) - You may discard a R Energy card attached to Quilava. If you do, the Defending Pokémon is now
  // Burned.
  it('Should use Burning Claw and discard a Fire Energy', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const fire = player.active.energies.cards[0];

    sim.dispatch(new AttackAction(1, 'Burning Claw'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose energy',
      playerId: player.id,
      message: GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
      cost: [CardType.FIRE],
      options: jasmine.objectContaining({ allowCancel: true })
    }));
    const prompt = prompts[0] as ChooseEnergyPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [prompt.energy[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.BURNED]);
    expect(player.discard.cards).toEqual([fire]);
    expect(player.active.energies.cards.length).toEqual(2);
  });

  it('Should use Burning Claw without discarding', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Burning Claw'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
    expect(opponent.active.specialConditions).toEqual([]);
    expect(player.discard.cards).toEqual([]);
    expect(player.active.energies.cards.length).toEqual(3);
  });
});
