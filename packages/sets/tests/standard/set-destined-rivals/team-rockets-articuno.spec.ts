import {
  AddSpecialConditionsEffect,
  AttackAction,
  AttackEffect,
  CardType,
  Effect,
  PokemonCard,
  PokemonSlot,
  Simulator,
  SpecialCondition,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

import { TeamRocketsArticuno } from '../../../src/standard/set-destined-rivals/team-rockets-articuno';
import { TeamRocketsEnergy } from '../../../src/standard/set-destined-rivals/team-rockets-energy';
import { TeamRocketsTarountula } from '../../../src/standard/set-destined-rivals/team-rockets-tarountula';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

// Attacker for the Repelling Veil tests: 30 damage and the Defending Pokémon is Poisoned.
class PoisonAttacker extends PokemonCard {
  public cardTypes: CardType[] = [CardType.GRASS];
  public hp = 100;
  public attacks = [{ name: 'Poison Bite', cost: [], damage: '30', text: 'Poisoned.' }];
  public set = 'TEST';
  public name = 'Poison Attacker';
  public fullName = 'Poison Attacker TEST';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      store.reduceEffect(state, new AddSpecialConditionsEffect(effect, [SpecialCondition.POISONED]));
    }
    return state;
  }
}

class TeamRocketsStage1 extends PokemonCard {
  public stage = Stage.STAGE_1;
  public cardTypes: CardType[] = [CardType.GRASS];
  public hp = 200;
  public set = 'TEST';
  public name = 'Team Rocket\'s Test Stage 1';
  public fullName = 'Team Rocket\'s Test Stage 1 TEST';
}

describe('Team Rocket\'s Articuno DRI', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  it('Should have the printed stats', () => {
    const card = new TeamRocketsArticuno();
    expect(card.hp).toEqual(120);
    expect(card.cardTypes).toEqual([CardType.WATER]);
    expect(card.weakness).toEqual([{ type: CardType.LIGHTNING }]);
    expect(card.resistance).toEqual([{ type: CardType.FIGHTING, value: -30 }]);
    expect(card.retreat).toEqual([CardType.COLORLESS]);
    expect(card.attacks[0].cost).toEqual([CardType.WATER, CardType.COLORLESS, CardType.COLORLESS]);
  });

  it('Dark Frost does 60 damage without Team Rocket\'s Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TeamRocketsArticuno()], [CardType.WATER, CardType.COLORLESS, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Dark Frost'));
    expect(opponent.active.damage).toEqual(60);
  });

  it('Dark Frost does 120 damage with Team Rocket\'s Energy attached', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TeamRocketsArticuno()], [CardType.WATER]);
    player.active.energies.cards.push(new TeamRocketsEnergy());
    sim.dispatch(new AttackAction(1, 'Dark Frost'));
    expect(opponent.active.damage).toEqual(120);
  });

  describe('Repelling Veil', () => {
    let defenderBench: PokemonSlot;

    beforeEach(() => {
      // player attacks with PoisonAttacker; the opponent has Articuno on the Bench.
      TestUtils.setActive(sim, [new PoisonAttacker()]);
      const { opponent } = TestUtils.getAll(sim);
      defenderBench = opponent.bench[0];
      defenderBench.pokemons.cards = [new TeamRocketsArticuno()];
    });

    it('prevents the effect, not the damage, on a Basic Team Rocket\'s Pokémon', () => {
      const { opponent } = TestUtils.getAll(sim);
      opponent.active.pokemons.cards = [new TeamRocketsTarountula()];
      sim.dispatch(new AttackAction(1, 'Poison Bite'));
      expect(opponent.active.damage).toEqual(30);
      expect(opponent.active.specialConditions).not.toContain(SpecialCondition.POISONED);
    });

    it('protects Articuno itself in the Active Spot', () => {
      const { opponent } = TestUtils.getAll(sim);
      defenderBench.pokemons.cards = [];
      opponent.active.pokemons.cards = [new TeamRocketsArticuno()];
      sim.dispatch(new AttackAction(1, 'Poison Bite'));
      expect(opponent.active.damage).toEqual(30);
      expect(opponent.active.specialConditions).not.toContain(SpecialCondition.POISONED);
    });

    it('does not protect a Pokémon that is not Team Rocket\'s', () => {
      const { opponent } = TestUtils.getAll(sim);
      opponent.active.pokemons.cards = [new TestPokemon()];
      sim.dispatch(new AttackAction(1, 'Poison Bite'));
      expect(opponent.active.specialConditions).toContain(SpecialCondition.POISONED);
    });

    it('does not protect an evolved Team Rocket\'s Pokémon', () => {
      const { opponent } = TestUtils.getAll(sim);
      opponent.active.pokemons.cards = [new TeamRocketsStage1()];
      sim.dispatch(new AttackAction(1, 'Poison Bite'));
      expect(opponent.active.specialConditions).toContain(SpecialCondition.POISONED);
    });

    it('does nothing while Articuno is not in play', () => {
      const { opponent } = TestUtils.getAll(sim);
      defenderBench.pokemons.cards = [];
      opponent.hand.cards = [new TeamRocketsArticuno()];
      opponent.active.pokemons.cards = [new TeamRocketsTarountula()];
      sim.dispatch(new AttackAction(1, 'Poison Bite'));
      expect(opponent.active.specialConditions).toContain(SpecialCondition.POISONED);
    });
  });
});
