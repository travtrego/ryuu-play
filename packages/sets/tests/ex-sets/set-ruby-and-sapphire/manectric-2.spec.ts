import {
  AttackAction,
  CardType,
  ChoosePokemonPrompt,
  GameMessage,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
  SpecialCondition,
} from '@ptcg/common';

import { Manectric2 } from '../../../src/ex-sets/set-ruby-and-sapphire/manectric-2';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Manectric RS 2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Manectric2()], [CardType.LIGHTNING, CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Thundershock (20) - Flip a coin. If heads, the Defending Pokémon is now Paralyzed.
  it('Should use Thundershock - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Thundershock'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Thundershock - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Thundershock'));

    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Gigashock (40) - Does 10 damage to 2 of your opponent's Benched Pokémon (1 if there is only 1). (Don't apply
  // Weakness and Resistance for Benched Pokémon.)
  it('Should use Gigashock - 3 Benched Pokemon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const weakBenched = new TestPokemon();
    weakBenched.weakness = [{ type: CardType.LIGHTNING }];
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[1] = TestUtils.pokemonSlot([weakBenched]);
    opponent.bench[2] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Gigashock'));

    const prompt = TestUtils.lastPrompt(sim) as ChoosePokemonPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.BENCH],
      options: jasmine.objectContaining({ min: 2, max: 2, allowCancel: false }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[1], opponent.bench[2]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
    expect(opponent.bench[0].damage).toEqual(0);
    expect(opponent.bench[1].damage).toEqual(10);
    expect(opponent.bench[2].damage).toEqual(10);
  });

  it('Should use Gigashock - 1 Benched Pokemon', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Gigashock'));

    const prompt = TestUtils.lastPrompt(sim) as ChoosePokemonPrompt;
    expect(prompt.options).toEqual(jasmine.objectContaining({ min: 1, max: 1 }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[0]]));

    expect(opponent.bench[0].damage).toEqual(10);
  });

  it('Should use Gigashock - no Benched Pokemon', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Gigashock'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });

});
