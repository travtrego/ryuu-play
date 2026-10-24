import {
  AddSpecialConditionsEffect,
  AttackAction,
  AttackEffect,
  CardType,
  Effect,
  GameMessage,
  PassTurnAction,
  PlayerType,
  PutDamageEffect,
  ResolvePromptAction,
  Simulator,
  SlotType,
  SpecialCondition,
  State,
  StateUtils,
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

class BenchAttackerPokemon extends TestPokemon {
  public attacks = [
    { name: 'Bench attack', cost: [], damage: '0', text: 'Does 10 damage to each Benched Pokémon.' },
  ];

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const opponent = StateUtils.getOpponent(state, effect.player);
      opponent.forEachPokemon(PlayerType.TOP_PLAYER, (pokemonSlot, pokemonCard, target) => {
        if (target.slot === SlotType.BENCH) {
          const dealDamage = new PutDamageEffect(effect, 10);
          dealDamage.target = pokemonSlot;
          store.reduceEffect(state, dealDamage);
        }
      });
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

  // "do the final result of that attack" copies the Special Condition too:
  //   Q. Can Spearow's Mirror Move poison the opponent if (let's say) the final result of the last attack was
  //      30 damage and poison?
  //   A. Yup! It would do 30 damage and Poison. (May 4, 2000 WotC Chat, Q28)
  it('Should use Mirror Move and also copy the Special Condition from the attack', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new AttackerPokemon()]);

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Poison attack'));
    expect(player.active.specialConditions).toEqual([SpecialCondition.POISONED]);

    sim.dispatch(new AttackAction(1, 'Mirror Move'));

    // 10 mirrored damage + 10 Poison damage between turns
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
  });

  it('Should use Mirror Move and copy no Special Condition when the attack applied none', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new AttackerPokemon()]);

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Attack 30'));
    expect(player.active.specialConditions).toEqual([]);

    sim.dispatch(new AttackAction(1, 'Mirror Move'));

    expect(opponent.active.damage).toEqual(30);
    expect(opponent.active.specialConditions).toEqual([]);
  });


  // Damage taken on the Bench counts:
  //   Q. If an opponent's attack damages my benched Pidgeotto, can Pidgeotto then do "Mirror Move" during my
  //      next turn and attack for the amount of damage it received while on the bench?
  //   A. Yes. (May 23, 2002 WotC Chat, Q273)
  it('Should use Mirror Move and do the damage Pidgeotto took while Benched', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const pidgeottoSlot = player.active;
    player.bench[0] = pidgeottoSlot;
    player.active = TestUtils.pokemonSlot([new TestPokemon()]);
    TestUtils.setDefending(sim, [new BenchAttackerPokemon()]);

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Bench attack'));
    expect(pidgeottoSlot.damage).toEqual(10);

    // Pidgeotto is promoted, and brings the remembered damage with it
    player.switchPokemon(pidgeottoSlot);
    sim.dispatch(new AttackAction(1, 'Mirror Move'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

});
