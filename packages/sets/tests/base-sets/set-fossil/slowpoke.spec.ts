import {
  AttackAction,
  CardType,
  ChooseEnergyPrompt,
  GameMessage,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Slowpoke } from '../../../src/base-sets/set-fossil/slowpoke';
import { Recycle } from '../../../src/base-sets/set-fossil/recycle';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Slowpoke FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Slowpoke()],
      [CardType.PSYCHIC, CardType.PSYCHIC]
    );
  });

  // Spacing Out - Flip a coin. If heads, remove a damage counter from Slowpoke. This attack can't be used if
  // Slowpoke has no damage counters on it.
  it('Should use Spacing Out - heads', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.active.damage = 20;
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Spacing Out'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.damage).toEqual(10);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Spacing Out - tails', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.active.damage = 20;
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Spacing Out'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.damage).toEqual(20);
  });

  // BUG: Spacing Out can be used (ending the turn) when Slowpoke has no damage counters; the card says it can't be
  it('Should not use Spacing Out when Slowpoke has no damage counters', () => {
    let message = '';
    try {
      sim.dispatch(new AttackAction(1, 'Spacing Out'));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    const { player } = TestUtils.getAll(sim);
    expect(message).not.toEqual('');
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
  });

  // Scavenge - Discard 1 P Energy card attached to Slowpoke in order to use this attack. Put a Trainer card from
  // your discard pile into your hand.
  it('Should use Scavenge', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    const trainer = new Recycle();
    const pokemon = new TestPokemon();
    player.discard.cards = [pokemon, trainer];
    const handSize = player.hand.cards.length;
    const energies = player.active.energies.cards.slice();

    sim.dispatch(new AttackAction(1, 'Scavenge'));

    const energyPrompt = prompts[0] as ChooseEnergyPrompt;
    expect(energyPrompt).toEqual(jasmine.objectContaining({
      type: 'Choose energy',
      playerId: player.id,
      message: GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
      cost: [CardType.PSYCHIC],
    }));
    sim.dispatch(new ResolvePromptAction(energyPrompt.id, [energyPrompt.energy[0]]));

    expect(prompts[1]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      cards: player.discard,
      options: jasmine.objectContaining({ min: 1, max: 1, blocked: [0, 2] })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [trainer]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.energies.cards).toEqual([energies[1]]);
    expect(player.discard.cards).toEqual([pokemon, energies[0]]);
    expect(player.hand.cards.length).toEqual(handSize + 1);
    expect(player.hand.cards).toContain(trainer);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Scavenge - still discards Energy without Trainer cards in the discard pile', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    const energies = player.active.energies.cards.slice();

    sim.dispatch(new AttackAction(1, 'Scavenge'));
    const energyPrompt = prompts[0] as ChooseEnergyPrompt;
    sim.dispatch(new ResolvePromptAction(energyPrompt.id, [energyPrompt.energy[0]]));

    expect(prompts.length).toEqual(1);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.energies.cards).toEqual([energies[1]]);
    expect(player.discard.cards).toEqual([energies[0]]);
  });
});
