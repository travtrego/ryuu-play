import {
  AttackAction,
  CardType,
  ChooseEnergyPrompt,
  GameMessage,
  ResolvePromptAction,
  RetreatAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { TyphlosionEx } from '../../../src/ex-sets/set-sandstorm/typhlosion-ex';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Typhlosion ex SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 3;

    TestUtils.setActive(
      sim,
      [new TyphlosionEx()],
      [CardType.FIRE, CardType.FIRE, CardType.FIRE, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  // Ring of Fire (40) - The Defending Pokémon is now Burned, and can't retreat until the end of your opponent's next
  // turn.
  it('Should use Ring of Fire', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Ring of Fire'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.BURNED]);

    let message = '';
    try {
      sim.dispatch(new RetreatAction(2, 0));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    expect(message).toEqual(GameMessage.BLOCKED_BY_EFFECT);
  });

  // Split Blast (100) - Discard 1 Energy card attached to Typhlosion ex. If your opponent has more than 1 Defending
  // Pokémon, you may do 50 damage to each of them instead.
  it('Should use Split Blast and discard 1 Energy', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Split Blast'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose energy',
      playerId: player.id,
      message: GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
      options: jasmine.objectContaining({ allowCancel: false })
    }));
    const prompt = prompts[0] as ChooseEnergyPrompt;
    const discarded = prompt.energy[0].card;
    sim.dispatch(new ResolvePromptAction(prompt.id, [prompt.energy[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(100);
    expect(player.active.energies.cards.length).toEqual(4);
    expect(player.discard.cards).toEqual([discarded]);
  });

  it('Should use Split Blast and allow discarding any Energy card', () => {
    const { prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Split Blast'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose energy',
      cost: [CardType.COLORLESS]
    }));
  });
});
