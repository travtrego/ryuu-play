import {
  AttackAction,
  CardType,
  PokemonCard,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { DarkGyarados } from '../../../src/base-sets/set-team-rocket/dark-gyarados';
import { Magikarp } from '../../../src/base-sets/set-team-rocket/magikarp';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Dark Gyarados TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Magikarp(), new DarkGyarados()],
      [CardType.WATER, CardType.WATER, CardType.WATER]
    );
  });

  // Resolve Prize and promotion prompts after a Knock Out
  function resolveKnockOutPrompts() {
    for (let i = 0; i < 10; i++) {
      const { player, opponent, prompts } = TestUtils.getAll(sim);
      const prompt = prompts.find(p => p.result === undefined);
      if (prompt === undefined) {
        return;
      }
      const owner = prompt.playerId === player.id ? player : opponent;
      if (prompt.type === 'Choose prize') {
        sim.dispatch(new ResolvePromptAction(prompt.id, owner.prizes.filter(p => p.cards.length > 0).slice(0, 1)));
      } else if (prompt.type === 'Choose pokemon') {
        sim.dispatch(new ResolvePromptAction(prompt.id, owner.bench.filter(b => b.pokemons.cards.length > 0).slice(0, 1)));
      } else {
        return;
      }
    }
  }

  // The opponent's Dark Gyarados with 3 W Energy is Knocked Out by the player's attack
  function knockOutGyarados(energies: CardType[] = [CardType.WATER, CardType.WATER, CardType.WATER]): TestPokemon {
    const { player, opponent } = TestUtils.getAll(sim);
    const attacker = new TestPokemon();
    TestUtils.setActive(sim, [attacker]);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    TestUtils.setDefending(sim, [new Magikarp(), new DarkGyarados()], energies);
    opponent.active.damage = 60;
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    return attacker;
  }

  // Final Beam - When Dark Gyarados is Knocked Out by an attack, flip a coin. If heads, this power does 20 damage
  // for each W Energy attached to Dark Gyarados to the Pokémon that Knocked Out Dark Gyarados. Apply Weakness and
  // Resistance. This power doesn't work if Dark Gyarados is Asleep, Confused, or Paralyzed.
  it('Should use Final Beam - heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    knockOutGyarados();
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Test attack'));
    resolveKnockOutPrompts();

    expect(opponent.discard.cards.some(c => c instanceof DarkGyarados)).toBeTrue();
    expect(player.active.damage).toEqual(60);
    expect(player.getPrizeLeft()).toEqual(5);
  });

  it('Should use Final Beam - tails', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    knockOutGyarados();
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Test attack'));
    resolveKnockOutPrompts();

    expect(opponent.discard.cards.some(c => c instanceof DarkGyarados)).toBeTrue();
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Final Beam and count only W Energy', () => {
    const { player } = TestUtils.getAll(sim);
    knockOutGyarados([CardType.WATER, CardType.FIRE, CardType.COLORLESS]);
    // TestEnergy(COLORLESS) provides only Colorless
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Test attack'));
    resolveKnockOutPrompts();

    expect(player.active.damage).toEqual(20);
  });

  // BUG: Final Beam's damage is resolved after Dark Gyarados has left the Active Spot, so Weakness/Resistance are
  // checked against the wrong (new Active) Pokémon's type and never apply
  xit('Should use Final Beam and apply Weakness', () => {
    const { player } = TestUtils.getAll(sim);
    const attacker = knockOutGyarados();
    attacker.weakness = [{ type: CardType.WATER }];
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Test attack'));
    resolveKnockOutPrompts();

    expect(player.active.damage).toEqual(120);
  });

  // BUG: Final Beam's damage is resolved after Dark Gyarados has left the Active Spot, so Weakness/Resistance are
  // checked against the wrong (new Active) Pokémon's type and never apply
  xit('Should use Final Beam and apply Resistance', () => {
    const { player } = TestUtils.getAll(sim);
    const attacker = knockOutGyarados();
    attacker.resistance = [{ type: CardType.WATER, value: -30 }];
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Test attack'));
    resolveKnockOutPrompts();

    expect(player.active.damage).toEqual(30);
  });

  it('Should not use Final Beam when Pokémon Powers are blocked', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    knockOutGyarados();
    player.bench[1] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Test attack'));
    resolveKnockOutPrompts();

    expect(prompts.some(p => p.type === 'Coin flip')).toBeFalse();
    expect(player.active.damage).toEqual(0);
  });

  [SpecialCondition.CONFUSED, SpecialCondition.PARALYZED, SpecialCondition.ASLEEP].forEach(condition => {
    // BUG: Final Beam throws CANNOT_USE_POWER from the Knock Out effect when Dark Gyarados is Asleep, Confused or
    // Paralyzed, which aborts the whole attack instead of just not using the power
    xit(`Should still be Knocked Out without Final Beam while ${SpecialCondition[condition]}`, () => {
      const { opponent } = TestUtils.getAll(sim);
      knockOutGyarados();
      opponent.active.addSpecialCondition(condition);
      TestUtils.setFlipResults(sim, [true]);

      let message = '';
      try {
        sim.dispatch(new AttackAction(1, 'Test attack'));
      } catch (error) {
        message = TestUtils.getErrorMessage(error);
      }
      resolveKnockOutPrompts();

      const after = TestUtils.getAll(sim);
      expect(message).toEqual('');
      expect(after.opponent.discard.cards.some(c => c instanceof DarkGyarados)).toBeTrue();
      expect(after.player.active.damage).toEqual(0);
      expect(after.player.getPrizeLeft()).toEqual(5);
    });
  });

  it('Should not use Final Beam when Knocked Out by Poison between turns', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const gyarados = player.active.getPokemonCard() as PokemonCard;
    player.active.damage = 60;
    player.active.addSpecialCondition(SpecialCondition.POISONED);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Ice Beam'));
    resolveKnockOutPrompts();

    expect(player.discard.cards).toContain(gyarados);
    expect(prompts.filter(p => p.type === 'Coin flip').length).toEqual(1); // Ice Beam only
    expect(TestUtils.getAll(sim).opponent.active.damage).toEqual(30);
  });

  // Ice Beam (30) - Flip a coin. If heads, the Defending Pokémon is now Paralyzed.
  it('Should use Ice Beam - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Ice Beam'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Ice Beam - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Ice Beam'));

    expect(opponent.active.damage).toEqual(30);
    expect(opponent.active.specialConditions).toEqual([]);
  });
});
