import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { DarkPrimeape } from '../../../src/base-sets/set-team-rocket/dark-primeape';
import { Mankey } from '../../../src/base-sets/set-team-rocket/mankey';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Dark Primeape TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Mankey(), new DarkPrimeape()],
      [CardType.FIGHTING, CardType.FIGHTING]
    );
  });

  // Frenzied Attack (40) - Dark Primeape is now Confused (after doing damage).
  it('Should use Frenzied Attack - 40 damage, then Dark Primeape is Confused', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Frenzied Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
    expect(opponent.active.specialConditions).toEqual([]);
    expect(player.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
  });

  // Frenzy - If Dark Primeape does any damage while it's Confused (even to itself), it does 30 more damage.
  it('Should use Frenzy - 30 more damage while Confused (confusion heads)', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.addSpecialCondition(SpecialCondition.CONFUSED);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Frenzied Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(70);
    expect(player.active.damage).toEqual(0);
    expect(player.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
  });

  it('Should use Frenzy - 30 more damage to itself when it hurts itself in confusion', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new Mankey()]);
    player.active.damage = 10;
    player.active.addSpecialCondition(SpecialCondition.CONFUSED);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Frenzied Attack'));

    // 10 + the engine's confusion self-damage (30) + Frenzy's 30 = 70 > 60 HP
    expect(opponent.active.damage).toEqual(0);
    expect(player.discard.cards.some(c => c instanceof DarkPrimeape)).toBeTrue();
    expect(prompts.some(p => p.type === 'Choose prize' && p.playerId === opponent.id)).toBeTrue();
  });

  it('Should not add Frenzy damage to itself when Pokémon Powers are blocked', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.damage = 10;
    player.active.addSpecialCondition(SpecialCondition.CONFUSED);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Frenzied Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.damage).toEqual(40);
  });

  it('Should not use Frenzy when Pokémon Powers are blocked', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.addSpecialCondition(SpecialCondition.CONFUSED);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Frenzied Attack'));

    expect(opponent.active.damage).toEqual(40);
  });
});
