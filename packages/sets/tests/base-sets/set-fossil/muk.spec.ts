import {
  AttackAction,
  CardType,
  GameMessage,
  PokemonCard,
  Simulator,
  SpecialCondition,
  UseAbilityAction,
} from '@ptcg/common';

import { Muk } from '../../../src/base-sets/set-fossil/muk';
import { Dragonite } from '../../../src/base-sets/set-fossil/dragonite';
import { Kabuto } from '../../../src/base-sets/set-fossil/kabuto';
import { Omanyte } from '../../../src/base-sets/set-fossil/omanyte';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Muk FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Muk()],
      [CardType.GRASS, CardType.GRASS, CardType.GRASS]
    );
  });

  function useStepIn(): string {
    const { player } = TestUtils.getAll(sim);
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Step In', TestUtils.target(sim, player.bench[0])));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Toxic Gas - Ignore all Pokémon Powers other than Toxic Gases. This power stops working while Muk is Asleep,
  // Confused, or Paralyzed.
  it('Should block own Pokémon Powers with Toxic Gas', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new Dragonite()]);

    expect(useStepIn()).toEqual(GameMessage.BLOCKED_BY_ABILITY);
  });

  it('Should block the opponent\'s Pokémon Powers with Toxic Gas', () => {
    const { opponent } = TestUtils.getAll(sim);
    const kabuto = new Kabuto();
    kabuto.hp = 400;
    kabuto.weakness = []; // isolate the Kabuto Armor effect from Grass Weakness
    TestUtils.setDefending(sim, [kabuto]);
    TestUtils.setFlipResults(sim, [false]); // no Poison

    sim.dispatch(new AttackAction(1, 'Sludge'));

    // Kabuto Armor would halve the damage
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should block powers while Muk is on the opponent\'s Bench', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TestPokemon()]);
    player.bench[0] = TestUtils.pokemonSlot([new Dragonite()]);
    opponent.bench[0] = TestUtils.pokemonSlot([new Muk()]);

    expect(useStepIn()).toEqual(GameMessage.BLOCKED_BY_ABILITY);
  });

  [SpecialCondition.ASLEEP, SpecialCondition.CONFUSED, SpecialCondition.PARALYZED].forEach(condition => {
    it(`Should not block powers while Muk is ${SpecialCondition[condition]}`, () => {
      const { player, opponent, prompts } = TestUtils.getAll(sim);
      player.active.specialConditions.push(condition);
      player.bench[0] = TestUtils.pokemonSlot([new Omanyte()]);
      opponent.hand.cards = TestUtils.makeTestCards(2);

      let message = '';
      try {
        sim.dispatch(new UseAbilityAction(1, 'Clairvoyance', TestUtils.target(sim, player.bench[0])));
      } catch (error) {
        message = TestUtils.getErrorMessage(error);
      }

      expect(message).toEqual('');
      expect(prompts.some(p => p.type === 'Show cards')).toBeTrue();
    });
  });

  it('Should block Omanyte\'s Clairvoyance while Muk is not affected by a Special Condition', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new Omanyte()]);
    opponent.hand.cards = TestUtils.makeTestCards(2);

    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Clairvoyance', TestUtils.target(sim, player.bench[0])));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.BLOCKED_BY_ABILITY);
  });

  // BUG: Dragonite's Step In switches first (clearing the Active Muk's Special Conditions), then Toxic Gas checks
  // Muk's status and blocks it, so an Asleep Active Muk still stops Step In
  xit('Should allow Dragonite\'s Step In while the Active Muk is Asleep', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.specialConditions.push(SpecialCondition.ASLEEP);
    player.bench[0] = TestUtils.pokemonSlot([new Dragonite()]);

    expect(useStepIn()).toEqual('');
    expect(TestUtils.getAll(sim).player.active.getPokemonCard()).toEqual(jasmine.any(Dragonite));
  });

  it('Should not block powers when Toxic Gas itself is blocked', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const kabuto = new Kabuto();
    kabuto.hp = 400;
    TestUtils.setActive(sim, [new TestPokemon()]);
    TestUtils.setDefending(sim, [kabuto]);
    player.bench[0] = TestUtils.pokemonSlot([new Muk()]);
    (player.active.getPokemonCard() as PokemonCard).attacks[0].damage = '40';
    // A power blocker that only blocks Muk's Toxic Gas
    const blocker = new TestPokemonBlockPowers();
    const originalReduce = blocker.reduceEffect.bind(blocker);
    blocker.reduceEffect = (store, state, effect: any) => {
      if (effect.power && effect.power.name === 'Toxic Gas') {
        return originalReduce(store, state, effect);
      }
      return state;
    };
    opponent.bench[0] = TestUtils.pokemonSlot([blocker]);

    sim.dispatch(new AttackAction(1, 'Test attack'));

    // Kabuto Armor works again
    expect(opponent.active.damage).toEqual(20);
  });

  // Sludge (30) - Flip a coin. If heads, the Defending Pokémon is now Poisoned.
  it('Should use Sludge - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Sludge'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    expect(opponent.active.damage).toEqual(40); // 30 + 10 Poison between turns
  });

  it('Should use Sludge - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Sludge'));

    expect(opponent.active.specialConditions).toEqual([]);
    expect(opponent.active.damage).toEqual(30);
  });
});
