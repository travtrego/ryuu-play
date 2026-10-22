import {
  AddSpecialConditionsEffect,
  AttackAction,
  AttackEffect,
  CardType,
  Effect,
  GameMessage,
  PassTurnAction,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
  SpecialCondition,
  State,
  StoreLike,
} from '@ptcg/common';

import { Pidgeotto } from '../../../src/base-sets/set-base/pidgeotto';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class AttackerPokemon extends TestPokemon {
  public attacks = [
    { name: 'Attack 30', cost: [], damage: '30', text: '' },
    { name: 'Poison attack', cost: [], damage: '10', text: 'The Defending Pokémon is now Poisoned.' },
  ];

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      store.reduceEffect(state, new AddSpecialConditionsEffect(effect, [SpecialCondition.POISONED]));
    }
    return state;
  }
}

describe('Pidgeotto BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Pidgeotto()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  // Whirlwind (20) - If your opponent has any Benched Pokémon, he or she chooses 1 of them and switches it with
  // the Defending Pokémon. (Do the damage before switching the Pokémon.)
  it('Should use Whirlwind, do the damage, then the opponent chooses a Benched Pokémon to switch', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();
    const benched = new TestPokemon();
    opponent.bench[0] = TestUtils.pokemonSlot([benched]);

    sim.dispatch(new AttackAction(1, 'Whirlwind'));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: opponent.id,
      message: GameMessage.CHOOSE_POKEMON_TO_SWITCH,
      playerType: PlayerType.BOTTOM_PLAYER,
      slots: [SlotType.BENCH],
      options: jasmine.objectContaining({ allowCancel: false })
    }));

    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.getPokemonCard()).toBe(benched);
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.bench[0].getPokemonCard()).toBe(defending);
    expect(opponent.bench[0].damage).toEqual(20);
  });

  it('Should use Whirlwind without switching when the opponent has no Benched Pokémon', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Whirlwind'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  // Mirror Move - If Pidgeotto was attacked last turn, do the final result of that attack on Pidgeotto to the
  // Defending Pokémon.
  it('Should use Mirror Move and do nothing if Pidgeotto was not attacked last turn', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Mirror Move'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Mirror Move and do the damage Pidgeotto took last turn', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new AttackerPokemon()]);

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Attack 30'));
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(30);

    sim.dispatch(new AttackAction(1, 'Mirror Move'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Mirror Move and do nothing if Pidgeotto was attacked two turns ago', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new AttackerPokemon()]);

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Attack 30'));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new PassTurnAction(2));
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();

    sim.dispatch(new AttackAction(1, 'Mirror Move'));

    expect(opponent.active.damage).toEqual(0);
  });

  // OPEN RULES QUESTION (not a confirmed bug): the printed text says "do the final result of that attack", which
  // would include Special Conditions, but common/attacks/mirror-move.ts deliberately copies damage only, citing an
  // errata. Kept pending until an official ruling is found; do not change the card on a guess.
  xit('Should use Mirror Move and also copy the Special Condition from the attack', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new AttackerPokemon()]);

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Poison attack'));
    expect(player.active.specialConditions).toEqual([SpecialCondition.POISONED]);

    sim.dispatch(new AttackAction(1, 'Mirror Move'));

    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
  });
});
