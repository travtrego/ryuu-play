import {
  AttackAction,
  CardType,
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  RetreatAction,
  Simulator,
  SpecialCondition,
  UseTrainerInPlayAction,
} from '@ptcg/common';

import { ClawFossil } from '../../../src/ex-sets/set-sandstorm/claw-fossil';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Claw Fossil SS', () => {
  let sim: Simulator;
  let fossil: ClawFossil;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 3;
    fossil = new ClawFossil();
  });

  // Play Claw Fossil as if it were a Basic Pokémon.
  it('Should be played onto the Bench as a Basic Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [fossil];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.bench[0])));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.bench[0].pokemons.cards).toEqual([fossil]);
    expect(player.bench[0].getPokemonCard()).toBe(fossil);
    expect(player.hand.cards).toEqual([]);
    expect(player.discard.cards).toEqual([]);
  });

  it('Should not be played onto an occupied slot', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [fossil];
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.bench[0])));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards).toEqual([fossil]);
  });

  // While in play, Claw Fossil counts as a C Pokémon. Claw Fossil has no attacks of its own.
  it('Should be a Colorless Pokémon with 40 HP and no attacks', () => {
    expect(fossil.cardTypes).toEqual([CardType.COLORLESS]);
    expect(fossil.hp).toEqual(40);
    expect(fossil.attacks).toEqual([]);
  });

  // At any time during your turn before your attack, you may discard Claw Fossil from play.
  it('Should be discarded from play', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([fossil]);

    sim.dispatch(new UseTrainerInPlayAction(1, TestUtils.target(sim, player.bench[0]), 'Claw Fossil'));
    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Confirm',
      playerId: player.id,
      message: GameMessage.WANT_TO_DISCARD_POKEMON
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, true));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.bench[0].pokemons.cards).toEqual([]);
    expect(player.discard.cards).toEqual([fossil]);
  });

  it('Should stay in play when the discard is not confirmed', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([fossil]);

    sim.dispatch(new UseTrainerInPlayAction(1, TestUtils.target(sim, player.bench[0]), 'Claw Fossil'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, false));

    expect(player.bench[0].pokemons.cards).toEqual([fossil]);
    expect(player.discard.cards).toEqual([]);
  });

  // ... can't retreat ...
  it('Should not retreat', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [fossil]);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    let message = '';
    try {
      sim.dispatch(new RetreatAction(1, 0));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.BLOCKED_BY_EFFECT);
    expect(player.active.getPokemonCard()).toBe(fossil);
  });

  // ... and can't be affected by any Special Conditions.
  [SpecialCondition.ASLEEP, SpecialCondition.CONFUSED, SpecialCondition.PARALYZED, SpecialCondition.POISONED,
    SpecialCondition.BURNED].forEach(condition => {
    it(`Should remove ${SpecialCondition[condition]} from itself`, () => {
      const { player } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [fossil]);
      player.active.addSpecialCondition(condition);
      player.hand.cards = [new TestPokemon()];

      // any action triggers the table state check
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.bench[0])));

      expect(player.active.specialConditions).toEqual([]);
    });
  });

  // If Claw Fossil is Knocked Out, it doesn't count as a Knocked Out Pokémon. (Discard it anyway.)
  it('Should not give a Prize card when Knocked Out', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [fossil]);
    opponent.active.damage = 30;
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    const handSize = player.hand.cards.length;

    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(prompts.some(p => p.type === 'Choose prize')).toBeFalse();
    expect(opponent.discard.cards).toContain(fossil);
    expect(player.prizes.every(p => p.cards.length === 1)).toBeTrue();
    expect(player.hand.cards.length).toEqual(handSize);
  });

  // Jagged Stone - If Claw Fossil is your Active Pokémon and is damaged by an opponent's attack (even if Claw Fossil
  // is Knocked Out), put 1 damage counter on the Attacking Pokémon.
  it('Should put 1 damage counter on the Attacking Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [fossil]);
    TestUtils.setActivePlayer(sim, opponent);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should put 1 damage counter on the Attacking Pokémon even if Claw Fossil is Knocked Out', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [fossil]);
    player.active.damage = 30;
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    TestUtils.setActivePlayer(sim, opponent);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(player.discard.cards).toContain(fossil);
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should not put damage counters when Jagged Stone is blocked', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [fossil]);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);
    TestUtils.setActivePlayer(sim, opponent);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(opponent.active.damage).toEqual(0);
  });

  it('Should not put damage counters when Claw Fossil is on the Bench', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([fossil]);
    TestUtils.setActivePlayer(sim, opponent);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(opponent.active.damage).toEqual(0);
  });
});
