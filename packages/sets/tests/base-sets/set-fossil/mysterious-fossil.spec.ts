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

import { MysteriousFossil } from '../../../src/base-sets/set-fossil/mysterious-fossil';
import { Ekans } from '../../../src/base-sets/set-fossil/ekans';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Mysterious Fossil FO', () => {
  let sim: Simulator;
  let fossil: MysteriousFossil;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    fossil = new MysteriousFossil();
  });

  // Play Mysterious Fossil as if it were a Basic Pokémon.
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
  });

  // At any time during your turn before your attack, you may discard Mysterious Fossil from play.
  it('Should be discarded from play', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([fossil]);

    sim.dispatch(new UseTrainerInPlayAction(1, TestUtils.target(sim, player.bench[0]), 'Mysterious Fossil'));
    expect(prompts.length).toEqual(1);
    expect(prompts[0].type).toEqual('Confirm');
    sim.dispatch(new ResolvePromptAction(prompts[0].id, true));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.bench[0].pokemons.cards).toEqual([]);
    expect(player.discard.cards).toEqual([fossil]);
  });

  it('Should stay in play when the discard is not confirmed', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([fossil]);

    sim.dispatch(new UseTrainerInPlayAction(1, TestUtils.target(sim, player.bench[0]), 'Mysterious Fossil'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, false));

    expect(player.bench[0].pokemons.cards).toEqual([fossil]);
    expect(player.discard.cards).toEqual([]);
  });

  // Mysterious Fossil has no attacks, can't retreat
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

    expect(message).not.toEqual('');
    const restored = TestUtils.getAll(sim).player;
    expect(restored.active.getPokemonCard()!.name).toEqual('Mysterious Fossil');
  });

  it('Should have no attacks', () => {
    expect(fossil.attacks).toEqual([]);
    expect(fossil.hp).toEqual(10);
  });

  // ... and can't be Asleep, Confused, Paralyzed, or Poisoned.
  it('Should not be affected by Special Conditions', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [fossil]);
    TestUtils.setDefending(sim, [new Ekans()], [CardType.GRASS, CardType.COLORLESS]);
    TestUtils.setActivePlayer(sim, opponent);
    TestUtils.setFlipResults(sim, [true]);

    // Spit Poison - heads, Poisoned
    sim.dispatch(new AttackAction(2, 'Spit Poison'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.getPokemonCard()).toBe(fossil);
    expect(player.active.specialConditions).toEqual([]);
    expect(player.active.damage).toEqual(0);
  });

  [SpecialCondition.ASLEEP, SpecialCondition.CONFUSED, SpecialCondition.PARALYZED, SpecialCondition.POISONED]
    .forEach(condition => {
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

  // If Mysterious Fossil is Knocked Out, it doesn't count as a Knocked Out Pokémon. (Discard it anyway.)
  it('Should not give a Prize card when Knocked Out', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [fossil]);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    const handSize = player.hand.cards.length;

    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(prompts.some(p => p.type === 'Choose prize')).toBeFalse();
    expect(opponent.discard.cards).toContain(fossil);
    expect(player.prizes.every(p => p.cards.length === 1)).toBeTrue();
    expect(player.hand.cards.length).toEqual(handSize);
  });
});
