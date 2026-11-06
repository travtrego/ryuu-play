import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
  UseAbilityAction,
} from '@ptcg/common';

import { Shiftry } from '../../../src/ex-sets/set-sandstorm/shiftry';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Shiftry SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Shiftry()],
      [CardType.GRASS, CardType.GRASS, CardType.COLORLESS, CardType.COLORLESS]
    );
    TestUtils.setDefending(sim, [new TestPokemon()], [CardType.WATER, CardType.FIRE]);
  });

  function useFanAway(): string {
    const { player } = TestUtils.getAll(sim);
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Fan Away', TestUtils.target(sim, player.active)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Fan Away - Once during your turn (before your attack), you may flip a coin. If heads, return 1 Energy card
  // attached to the Defending Pokémon to your opponent's hand. This power can't be used if Shiftry is affected by a
  // Special Condition.
  it('Should use Fan Away - heads', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const [water, fire] = opponent.active.energies.cards;
    opponent.hand.cards = [];
    TestUtils.setFlipResults(sim, [true]);

    expect(useFanAway()).toEqual('');

    const prompt = TestUtils.lastPrompt(sim)!;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      cards: opponent.active.energies,
      options: jasmine.objectContaining({ min: 1, max: 1 })
    }));
    expect(prompts.length).toEqual(2);
    sim.dispatch(new ResolvePromptAction(prompt.id, [fire]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.active.energies.cards).toEqual([water]);
    expect(opponent.hand.cards).toEqual([fire]);
  });

  it('Should use Fan Away - tails', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.hand.cards = [];
    TestUtils.setFlipResults(sim, [false]);

    expect(useFanAway()).toEqual('');

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.active.energies.cards.length).toEqual(2);
    expect(opponent.hand.cards).toEqual([]);
  });

  it('Should use Fan Away only once per turn', () => {
    TestUtils.setFlipResults(sim, [false]);

    expect(useFanAway()).toEqual('');
    expect(useFanAway()).toEqual(GameMessage.POWER_ALREADY_USED);
  });

  it('Should use Fan Away from the Bench', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TestPokemon()]);
    player.bench[0] = TestUtils.pokemonSlot([new Shiftry()]);
    TestUtils.setFlipResults(sim, [false]);

    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Fan Away', TestUtils.target(sim, player.bench[0])));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual('');
    expect(opponent).toBeDefined();
  });

  it('Should not use Fan Away when the Defending Pokémon has no Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.active.energies.cards = [];

    expect(useFanAway()).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  it('Should not use Fan Away when Shiftry is affected by a Special Condition', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.addSpecialCondition(SpecialCondition.CONFUSED);

    expect(useFanAway()).toEqual(GameMessage.CANNOT_USE_POWER);
    expect(opponent.active.energies.cards.length).toEqual(2);
  });

  // Light Touch Throw (80-) - Does 80 damage minus 10 damage for each Energy attached to the Defending Pokémon.
  it('Should use Light Touch Throw', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Light Touch Throw'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Light Touch Throw against a Defending Pokémon without Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.active.energies.cards = [];

    sim.dispatch(new AttackAction(1, 'Light Touch Throw'));

    expect(opponent.active.damage).toEqual(80);
  });
});
