import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Machamp } from '../../../src/base-sets/set-base/machamp';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

// Attacker that would take double damage from Fighting-type damage if Weakness were applied.
class FightingWeakPokemon extends TestPokemon {
  public weakness = [{ type: CardType.FIGHTING }];
}

describe('Machamp BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    // Machamp is the opponent's Defending Pokémon; the player's TestPokemon attacks it.
    TestUtils.setDefending(
      sim,
      [new Machamp()],
      [CardType.FIGHTING, CardType.FIGHTING, CardType.FIGHTING, CardType.COLORLESS],
    );
  });

  // Strikes Back - Whenever your opponent's attack damages Machamp (even if Machamp is Knocked Out), this power
  // does 10 damage to the attacking Pokémon. (Don't apply Weakness and Resistance.)
  it('Should use Strikes Back and do 10 damage to the attacking Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(player.active.damage).toEqual(10);
  });

  it('Should not apply Weakness to Strikes Back damage', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new FightingWeakPokemon()]);

    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(player.active.damage).toEqual(10);
  });

  it('Should use Strikes Back even if Machamp is Knocked Out', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const machamp = opponent.active.getPokemonCard();
    opponent.active.damage = 90;

    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(opponent.discard.cards).toContain(machamp as any);
    expect(player.active.damage).toEqual(10);
  });

  it('Should not use Strikes Back when the attack does no damage', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const attacker = new TestPokemon();
    attacker.attacks = [{ name: 'No damage', cost: [], damage: '', text: '' }];
    TestUtils.setActive(sim, [attacker]);

    sim.dispatch(new AttackAction(1, 'No damage'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(player.active.damage).toEqual(0);
  });

  it('Should not use Strikes Back when Machamp is Asleep', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.active.addSpecialCondition(SpecialCondition.ASLEEP);

    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(opponent.active.damage).toEqual(10);
    expect(player.active.damage).toEqual(0);
  });

  it('Should not use Strikes Back when Machamp is Confused', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.active.addSpecialCondition(SpecialCondition.CONFUSED);

    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(opponent.active.damage).toEqual(10);
    expect(player.active.damage).toEqual(0);
  });

  it('Should not use Strikes Back when Machamp is Paralyzed', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.active.addSpecialCondition(SpecialCondition.PARALYZED);

    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(opponent.active.damage).toEqual(10);
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Strikes Back when Machamp is Poisoned', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.active.addSpecialCondition(SpecialCondition.POISONED);

    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(player.active.damage).toEqual(10);
  });

  it('Should not use Strikes Back when Pokémon Powers are blocked', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(player.active.damage).toEqual(0);
  });

  it('Should use Seismic Toss', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    // Put Machamp on the attacking side
    const machamp = opponent.active.getPokemonCard() as Machamp;
    TestUtils.setActive(
      sim,
      [machamp],
      [CardType.FIGHTING, CardType.FIGHTING, CardType.FIGHTING, CardType.COLORLESS],
    );
    TestUtils.setDefending(sim, [new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Seismic Toss'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
    expect(player.active.damage).toEqual(0);
  });
});
