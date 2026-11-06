import {
  AttackAction,
  CardType,
  PassTurnAction,
  PokemonCard,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Kabuto } from '../../../src/base-sets/set-fossil/kabuto';
import { Hitmonlee } from '../../../src/base-sets/set-fossil/hitmonlee';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Kabuto FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Kabuto()],
      [CardType.COLORLESS]
    );
  });

  function attackDefendingKabuto(damage: number, cardTypes: CardType[] = []) {
    const { player } = TestUtils.getAll(sim);
    const kabuto = new Kabuto();
    kabuto.hp = 400; // keep it in play to measure damage
    TestUtils.setActive(sim, [new TestPokemon()]);
    TestUtils.setDefending(sim, [kabuto]);
    const attacker = player.active.getPokemonCard() as PokemonCard;
    attacker.attacks[0].damage = String(damage);
    attacker.cardTypes = cardTypes;
    sim.dispatch(new AttackAction(1, 'Test attack'));
  }

  // Kabuto Armor - Whenever an attack (even your own) does damage to Kabuto (after applying Weakness and
  // Resistance), that attack does half the damage to Kabuto (rounded down to the nearest 10). (Any other effects of
  // attacks still happen.) This power stops working while Kabuto is Asleep, Confused, or Paralyzed.
  it('Should halve 40 damage to 20', () => {
    const { opponent } = TestUtils.getAll(sim);
    attackDefendingKabuto(40);
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should halve 50 damage to 20 (rounded down)', () => {
    const { opponent } = TestUtils.getAll(sim);
    attackDefendingKabuto(50);
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should halve 10 damage to 0 (rounded down)', () => {
    const { opponent } = TestUtils.getAll(sim);
    attackDefendingKabuto(10);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should halve damage after applying Weakness', () => {
    const { opponent } = TestUtils.getAll(sim);
    // 30 Grass damage doubled by Kabuto's Grass Weakness = 60, halved = 30
    attackDefendingKabuto(30, [CardType.GRASS]);
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should halve damage done to a Benched Kabuto', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Hitmonlee()], [CardType.FIGHTING, CardType.FIGHTING]);
    opponent.bench[0] = TestUtils.pokemonSlot([new Kabuto()]);

    sim.dispatch(new AttackAction(1, 'Stretch Kick'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[0]]));

    expect(opponent.bench[0].damage).toEqual(10);
  });

  [SpecialCondition.ASLEEP, SpecialCondition.CONFUSED, SpecialCondition.PARALYZED].forEach(condition => {
    it(`Should not halve damage while Kabuto is ${SpecialCondition[condition]}`, () => {
      const { opponent, player } = TestUtils.getAll(sim);
      const kabuto = new Kabuto();
      kabuto.hp = 400;
      TestUtils.setActive(sim, [new TestPokemon()]);
      TestUtils.setDefending(sim, [kabuto]);
      opponent.active.specialConditions.push(condition);
      (player.active.getPokemonCard() as PokemonCard).attacks[0].damage = '40';

      sim.dispatch(new AttackAction(1, 'Test attack'));

      expect(opponent.active.damage).toEqual(40);
    });
  });

  it('Should not halve damage when Pokémon Powers are blocked', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);
    attackDefendingKabuto(40);
    expect(opponent.active.damage).toEqual(40);
  });

  it('Should not halve damage that is not done by an attack (Poison)', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.specialConditions.push(SpecialCondition.POISONED);

    sim.dispatch(new PassTurnAction(1));

    expect(player.active.damage).toEqual(10);
  });

  // Scratch (10)
  it('Should use Scratch', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Scratch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });
});
