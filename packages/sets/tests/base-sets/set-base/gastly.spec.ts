import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Gastly } from '../../../src/base-sets/set-base/gastly';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Gastly BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Gastly()],
      [CardType.PSYCHIC, CardType.COLORLESS],
    );
  });

  // Sleeping Gas - Flip a coin. If heads, the Defending Pokémon is now Asleep.
  it('Should use Sleeping Gas - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    // heads for the attack, tails for the between-turns sleep check
    TestUtils.setFlipResults(sim, [true, false]);

    sim.dispatch(new AttackAction(1, 'Sleeping Gas'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
  });

  it('Should use Sleeping Gas - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Sleeping Gas'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Destiny Bond - Discard 1 P Energy card attached to Gastly in order to use this attack. If a Pokémon Knocks
  // Out Gastly during your opponent's next turn, Knock Out that Pokémon.
  it('Should use Destiny Bond - discards a Psychic Energy', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Destiny Bond'));

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
    expect(opponent.active.damage).toEqual(0);
    expect(player.active.energies.cards).toEqual(TestUtils.makeEnergies([CardType.COLORLESS]));
    expect(player.discard.cards).toEqual([psychic]);
  });

  it('Should use Destiny Bond - Knocks Out the Pokémon that Knocks Out Gastly', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    const gastly = player.active.getPokemonCard() as Gastly;
    const attacker = new TestPokemon();
    attacker.attacks = [{ name: 'Big attack', cost: [], damage: '30', text: '' }];
    TestUtils.setDefending(sim, [attacker]);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Destiny Bond'));
    const psychic = player.active.energies.cards[0];
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [{ card: psychic, provides: [CardType.PSYCHIC], provideAmount: 1 }]));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();

    // Opponent Knocks Out Gastly (30 HP)
    sim.dispatch(new AttackAction(2, 'Big attack'));

    expect(player.discard.cards).toContain(gastly);
    expect(opponent.discard.cards).toContain(attacker);
  });

  it('Should use Destiny Bond - Pokémon that does not Knock Out Gastly is not Knocked Out', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    const gastly = player.active.getPokemonCard() as Gastly;
    const attacker = opponent.active.getPokemonCard() as TestPokemon;

    sim.dispatch(new AttackAction(1, 'Destiny Bond'));
    const psychic = player.active.energies.cards[0];
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [{ card: psychic, provides: [CardType.PSYCHIC], provideAmount: 1 }]));

    // Opponent does 10 damage to Gastly
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.pokemons.cards).toEqual([gastly]);
    expect(player.active.damage).toEqual(10);
    expect(opponent.active.pokemons.cards).toEqual([attacker]);
    expect(opponent.active.damage).toEqual(0);
  });

});
