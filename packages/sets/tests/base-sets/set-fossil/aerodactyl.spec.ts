import {
  AttackAction,
  CardType,
  GameMessage,
  PlayCardAction,
  Simulator,
  SpecialCondition,
  Stage,
} from '@ptcg/common';

import { Aerodactyl } from '../../../src/base-sets/set-fossil/aerodactyl';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Aerodactyl FO', () => {
  let sim: Simulator;
  let evolution: TestPokemon;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 3;

    TestUtils.setActive(
      sim,
      [new Aerodactyl()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]
    );

    // A Stage 1 card that evolves from the benched 'Pokemon'
    const { player } = TestUtils.getAll(sim);
    evolution = new TestPokemon();
    evolution.stage = Stage.STAGE_1;
    evolution.evolvesFrom = 'Pokemon';
    evolution.name = 'Evolved Pokemon';
    evolution.fullName = 'Evolved Pokemon TEST';
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.bench[0].pokemonPlayedTurn = 1;
    player.hand.cards = [evolution];
  });

  function tryEvolve(): string {
    const { player } = TestUtils.getAll(sim);
    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.bench[0])));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Prehistoric Power - No more Evolution cards can be played. This power stops working while Aerodactyl is
  // Asleep, Confused, or Paralyzed.
  it('Should allow evolution when Aerodactyl is not in play (control)', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TestPokemon()]);

    const message = tryEvolve();

    expect(message).toEqual('');
    expect(player.bench[0].getPokemonCard()).toBe(evolution);
  });

  it('Should block evolution with Prehistoric Power', () => {
    const { player } = TestUtils.getAll(sim);

    const message = tryEvolve();

    expect(message).toEqual(GameMessage.BLOCKED_BY_ABILITY);
    expect(player.hand.cards).toEqual([evolution]);
    expect(player.bench[0].pokemons.cards.length).toEqual(1);
  });

  it('Should block evolution for the opponent\'s Aerodactyl too', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TestPokemon()]);
    opponent.bench[0] = TestUtils.pokemonSlot([new Aerodactyl()]);

    const message = tryEvolve();

    expect(message).toEqual(GameMessage.BLOCKED_BY_ABILITY);
    expect(player.hand.cards).toEqual([evolution]);
  });

  [SpecialCondition.ASLEEP, SpecialCondition.CONFUSED, SpecialCondition.PARALYZED].forEach(condition => {
    it(`Should not block evolution while Aerodactyl is ${SpecialCondition[condition]}`, () => {
      const { player } = TestUtils.getAll(sim);
      player.active.specialConditions.push(condition);

      const message = tryEvolve();

      expect(message).toEqual('');
      expect(player.bench[0].getPokemonCard()).toBe(evolution);
    });
  });

  it('Should not block evolution when Pokémon Powers are blocked', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    const message = tryEvolve();

    expect(message).toEqual('');
    expect(player.bench[0].getPokemonCard()).toBe(evolution);
  });

  // Wing Attack (30)
  it('Should use Wing Attack', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Wing Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });
});
