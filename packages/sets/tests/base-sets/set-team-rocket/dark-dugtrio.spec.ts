import {
  AttackAction,
  CardType,
  RetreatAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { DarkDugtrio } from '../../../src/base-sets/set-team-rocket/dark-dugtrio';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Dark Dugtrio TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 3;

    TestUtils.setActive(
      sim,
      [new DarkDugtrio()],
      [CardType.FIGHTING, CardType.FIGHTING]
    );
  });

  // Sinkhole - Whenever your opponent's Active Pokémon retreats, your opponent flips a coin. If tails, this power
  // does 20 damage to that Pokémon. (Don't apply Weakness and Resistance.) This power stops working while Dark
  // Dugtrio is Asleep, Confused, or Paralyzed.
  // (The player retreats here, so Dark Dugtrio belongs to the opponent.)
  function setupRetreat(): { retreating: TestPokemon } {
    const { player, opponent } = TestUtils.getAll(sim);
    const retreating = new TestPokemon();
    retreating.weakness = [{ type: CardType.FIGHTING }];
    TestUtils.setActive(sim, [retreating]);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    TestUtils.setDefending(sim, [new DarkDugtrio()]);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    return { retreating };
  }

  // BUG: the 20 damage is put on player.active after the coin flip resolves, which is the new Active Pokémon
  // instead of the Pokémon that retreated
  xit('Should do 20 damage to the retreating Pokémon - tails', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const { retreating } = setupRetreat();
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new RetreatAction(1, 0));

    expect(prompts.some(p => p.type === 'Coin flip' && p.playerId === player.id)).toBeTrue();
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.bench[0].getPokemonCard()).toBe(retreating);
    expect(player.bench[0].damage).toEqual(20);
    expect(player.active.damage).toEqual(0);
  });

  it('Should do 20 damage in total on retreat - tails', () => {
    const { player } = TestUtils.getAll(sim);
    setupRetreat();
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new RetreatAction(1, 0));

    expect(player.active.damage + player.bench[0].damage).toEqual(20);
  });

  it('Should do no damage on retreat - heads', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const { retreating } = setupRetreat();
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new RetreatAction(1, 0));

    expect(prompts.some(p => p.type === 'Coin flip')).toBeTrue();
    expect(player.bench[0].getPokemonCard()).toBe(retreating);
    expect(player.bench[0].damage).toEqual(0);
    expect(player.active.damage).toEqual(0);
  });

  it('Should work while Dark Dugtrio is on the Bench', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    setupRetreat();
    TestUtils.setDefending(sim, [new TestPokemon()]);
    opponent.bench[0] = TestUtils.pokemonSlot([new DarkDugtrio()]);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new RetreatAction(1, 0));

    expect(player.active.damage + player.bench[0].damage).toEqual(20);
  });

  it('Should not trigger on the Dark Dugtrio owner\'s own retreat', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.active.energies.cards = TestUtils.makeEnergies([CardType.COLORLESS, CardType.COLORLESS]);
    TestUtils.setActive(sim, [new TestPokemon()]);
    player.bench[1] = TestUtils.pokemonSlot([new DarkDugtrio()]);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new RetreatAction(1, 0));

    expect(prompts.some(p => p.type === 'Coin flip')).toBeFalse();
    expect(player.bench[0].damage).toEqual(0);
  });

  [SpecialCondition.ASLEEP, SpecialCondition.CONFUSED, SpecialCondition.PARALYZED].forEach(condition => {
    it(`Should not work while Dark Dugtrio is ${SpecialCondition[condition]}`, () => {
      const { player, opponent, prompts } = TestUtils.getAll(sim);
      setupRetreat();
      opponent.active.addSpecialCondition(condition);
      TestUtils.setFlipResults(sim, [false]);

      sim.dispatch(new RetreatAction(1, 0));

      expect(prompts.some(p => p.type === 'Coin flip')).toBeFalse();
      expect(player.active.damage + player.bench[0].damage).toEqual(0);
    });
  });

  it('Should not work when Pokémon Powers are blocked', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    setupRetreat();
    opponent.bench[1] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new RetreatAction(1, 0));

    expect(prompts.some(p => p.type === 'Coin flip')).toBeFalse();
    expect(player.active.damage + player.bench[0].damage).toEqual(0);
  });

  // Knock Down (20+) - Your opponent flips a coin. If tails, this attack does 20 damage plus 20 more damage; if
  // heads, this attack does 20 damage.
  it('Should use Knock Down - opponent flips tails', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Knock Down'));

    expect(prompts.find(p => p.type === 'Coin flip')!.playerId).toEqual(opponent.id);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Knock Down - opponent flips heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Knock Down'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });
});
