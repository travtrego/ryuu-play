import {
  AttackAction,
  CardType,
  GameMessage,
  PokemonCard,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Clefairy } from '../../../src/base-sets/set-base/clefairy';
import { TestUtils } from '../../test-utils';

describe('Clefairy BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Clefairy()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  // Sing - Flip a coin. If heads, the Defending Pokémon is now Asleep.
  it('Should use Sing - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    // heads for the attack, tails for the between-turns sleep check
    TestUtils.setFlipResults(sim, [true, false]);

    sim.dispatch(new AttackAction(1, 'Sing'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
  });

  it('Should use Sing - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Sing'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Metronome - Choose 1 of the Defending Pokémon's attacks. Metronome copies that attack except for its Energy
  // costs and anything else required in order to use that attack, such as discarding Energy cards.
  it('Should use Metronome - copies the Defending Pokémon\'s attack', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard() as PokemonCard;

    sim.dispatch(new AttackAction(1, 'Metronome'));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose attack',
      playerId: player.id,
      message: GameMessage.CHOOSE_ATTACK_TO_COPY,
      cards: [defending],
    }));

    sim.dispatch(new ResolvePromptAction(prompts[0].id, defending.attacks[0]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should use Metronome - ignores the copied attack\'s Energy cost', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard() as PokemonCard;
    defending.attacks = [{
      name: 'Expensive attack',
      cost: [CardType.FIRE, CardType.FIRE, CardType.FIRE, CardType.FIRE],
      damage: '60',
      text: ''
    }];

    sim.dispatch(new AttackAction(1, 'Metronome'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, defending.attacks[0]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Metronome - Defending Pokémon without attacks', () => {
    const { opponent } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard() as PokemonCard;
    defending.attacks = [];

    sim.dispatch(new AttackAction(1, 'Metronome'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

});
