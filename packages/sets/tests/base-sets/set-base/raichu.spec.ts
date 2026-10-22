import {
  AddSpecialConditionsEffect,
  AttackAction,
  AttackEffect,
  CardType,
  Effect,
  PassTurnAction,
  Simulator,
  SpecialCondition,
  State,
  StoreLike,
} from '@ptcg/common';

import { Raichu } from '../../../src/base-sets/set-base/raichu';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

// Opponent Pokémon whose attack also has an effect (Paralysis).
class ParalyzingPokemon extends TestPokemon {
  public attacks = [
    { name: 'Paralyzing attack', cost: [], damage: '10', text: 'The Defending Pokémon is now Paralyzed.' },
  ];

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      store.reduceEffect(state, new AddSpecialConditionsEffect(effect, [SpecialCondition.PARALYZED]));
    }
    return state;
  }
}

describe('Raichu BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Raichu()],
      [CardType.LIGHTNING, CardType.LIGHTNING, CardType.LIGHTNING, CardType.COLORLESS],
    );
  });

  // Agility (20) - Flip a coin. If heads, during your opponent's next turn, prevent all effects of attacks,
  // including damage, done to Raichu.
  it('Should use Agility and prevent damage and effects during the opponent\'s next turn on heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new ParalyzingPokemon()]);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Agility'));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);

    sim.dispatch(new AttackAction(2, 'Paralyzing attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(0);
    expect(player.active.specialConditions).toEqual([]);
  });

  it('Should use Agility and not prevent anything on tails', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new ParalyzingPokemon()]);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Agility'));
    expect(opponent.active.damage).toEqual(20);

    sim.dispatch(new AttackAction(2, 'Paralyzing attack'));

    expect(player.active.damage).toEqual(10);
    expect(player.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should stop Agility after the opponent\'s next turn', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Agility'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(player.active.damage).toEqual(10);
  });

  // Thunder (60) - Flip a coin. If tails, Raichu does 30 damage to itself.
  it('Should use Thunder without self damage on heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Thunder'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Thunder and do 30 damage to itself on tails', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Thunder'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
    expect(player.active.damage).toEqual(30);
  });
});
