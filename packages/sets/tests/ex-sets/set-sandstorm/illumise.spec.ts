import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Illumise } from '../../../src/ex-sets/set-sandstorm/illumise';
import { Volbeat } from '../../../src/ex-sets/set-sandstorm/volbeat';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Illumise SS', () => {
  let sim: Simulator;
  let attacker: TestPokemon;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Illumise()], [CardType.GRASS, CardType.COLORLESS]);

    attacker = new TestPokemon();
    attacker.cardTypes = [CardType.FIGHTING];
    attacker.attacks = [{ name: 'Test attack', cost: [], damage: '50', text: '' }];
    TestUtils.setDefending(sim, [attacker]);
  });

  function opponentAttacks() {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActivePlayer(sim, opponent);
    sim.dispatch(new AttackAction(2, 'Test attack'));
  }

  // Glowing Screen - As long as Volbeat is in play, any damage done to Illumise by attacks from F Pokémon and D
  // Pokémon is reduced by 30. You can't reduce more than 30 damage even if there is more than 1 Volbeat in play.
  it('Should reduce damage from a Fighting Pokémon by 30 when Volbeat is in play', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new Volbeat()]);

    opponentAttacks();

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(20);
  });

  it('Should reduce damage from a Darkness Pokémon by 30 when Volbeat is in play', () => {
    const { player } = TestUtils.getAll(sim);
    attacker.cardTypes = [CardType.DARK];
    player.bench[0] = TestUtils.pokemonSlot([new Volbeat()]);

    opponentAttacks();

    expect(player.active.damage).toEqual(20);
  });

  it('Should not reduce more than 30 damage with 2 Volbeat in play', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new Volbeat()]);
    player.bench[1] = TestUtils.pokemonSlot([new Volbeat()]);

    opponentAttacks();

    expect(player.active.damage).toEqual(20);
  });

  it('Should not reduce damage from other types', () => {
    const { player } = TestUtils.getAll(sim);
    attacker.cardTypes = [CardType.WATER];
    player.bench[0] = TestUtils.pokemonSlot([new Volbeat()]);

    opponentAttacks();

    expect(player.active.damage).toEqual(50);
  });

  it('Should not reduce damage without Volbeat in play', () => {
    const { player } = TestUtils.getAll(sim);

    opponentAttacks();

    expect(player.active.damage).toEqual(50);
  });

  it('Should not reduce damage when Glowing Screen is blocked', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new Volbeat()]);
    player.bench[1] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    opponentAttacks();

    expect(player.active.damage).toEqual(50);
  });

  // OPEN RULES QUESTION: "As long as Volbeat is in play" does not say "your Volbeat"; the code only counts Volbeat
  // on Illumise's own side. Should the opponent's Volbeat also enable Glowing Screen?
  xit('Should reduce damage when only the opponent has Volbeat in play', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new Volbeat()]);

    opponentAttacks();

    expect(player.active.damage).toEqual(20);
    expect(opponent).toBeDefined();
  });

  // Chaotic Noise - Flip a coin. If heads, the Defending Pokémon is now Confused. If tails, the Defending Pokémon is
  // now Asleep.
  it('Should use Chaotic Noise - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Chaotic Noise'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Chaotic Noise - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    // tails for the attack, tails for the Asleep check between turns
    TestUtils.setFlipResults(sim, [false, false]);

    sim.dispatch(new AttackAction(1, 'Chaotic Noise'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
  });

  // Pester (20+) - If the Defending Pokémon is affected by a Special Condition, this attack does 20 damage plus 20
  // more damage.
  it('Should use Pester against a healthy Defending Pokémon', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Pester'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Pester against an affected Defending Pokémon', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.active.addSpecialCondition(SpecialCondition.CONFUSED);

    sim.dispatch(new AttackAction(1, 'Pester'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });
});
