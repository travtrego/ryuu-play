import {
  AttackAction,
  CardType,
  PokemonCard,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Haunter } from '../../../src/base-sets/set-fossil/haunter';
import { Ekans } from '../../../src/base-sets/set-fossil/ekans';
import { Hitmonlee } from '../../../src/base-sets/set-fossil/hitmonlee';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Haunter FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Haunter()],
      [CardType.PSYCHIC, CardType.COLORLESS]
    );
  });

  function attackDefendingHaunter(damage: number) {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TestPokemon()]);
    TestUtils.setDefending(sim, [new Haunter()]);
    const attacker = player.active.getPokemonCard() as PokemonCard;
    attacker.attacks[0].damage = String(damage);
    sim.dispatch(new AttackAction(1, 'Test attack'));
  }

  // Transparency - Whenever an attack does anything to Haunter, flip a coin. If heads, prevent all effects of that
  // attack, including damage, done to Haunter. This power stops working while Haunter is Asleep, Confused, or
  // Paralyzed.
  it('Should prevent the attack with Transparency on heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    attackDefendingHaunter(30);

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should not prevent the attack with Transparency on tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    attackDefendingHaunter(30);

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should prevent Special Conditions with Transparency on heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Ekans()], [CardType.GRASS, CardType.COLORLESS]);
    TestUtils.setDefending(sim, [new Haunter()]);
    // Transparency heads, then Wrap heads
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Wrap'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  [SpecialCondition.ASLEEP, SpecialCondition.CONFUSED, SpecialCondition.PARALYZED].forEach(condition => {
    it(`Should not use Transparency while Haunter is ${SpecialCondition[condition]}`, () => {
      const { opponent, player } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new TestPokemon()]);
      TestUtils.setDefending(sim, [new Haunter()]);
      opponent.active.specialConditions.push(condition);
      const attacker = player.active.getPokemonCard() as PokemonCard;
      attacker.attacks[0].damage = '30';
      // heads would prevent damage if the power worked; also keeps Asleep Haunter asleep is irrelevant here
      TestUtils.setFlipResults(sim, [true]);

      sim.dispatch(new AttackAction(1, 'Test attack'));

      expect(opponent.active.damage).toEqual(30);
    });
  });

  it('Should not use Transparency when Pokémon Powers are blocked', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    attackDefendingHaunter(30);

    expect(opponent.active.damage).toEqual(30);
  });

  // BUG: Transparency only triggers when Haunter is the Defending Pokémon; attacks hitting a Benched Haunter ignore it
  xit('Should protect a Benched Haunter with Transparency on heads', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Hitmonlee()], [CardType.FIGHTING, CardType.FIGHTING]);
    opponent.bench[0] = TestUtils.pokemonSlot([new Haunter()]);
    TestUtils.setFlipResults(sim, [true]);

    // Stretch Kick - 20 damage to 1 of the opponent's Benched Pokémon
    sim.dispatch(new AttackAction(1, 'Stretch Kick'));
    const prompt = prompts.find(p => p.type === 'Choose pokemon');
    if (prompt && prompt.result === undefined) {
      sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[0]]));
    }

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.bench[0].damage).toEqual(0);
  });

  // Nightmare (10) - The Defending Pokémon is now Asleep.
  it('Should use Nightmare', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]); // stays Asleep between turns

    sim.dispatch(new AttackAction(1, 'Nightmare'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
  });
});
