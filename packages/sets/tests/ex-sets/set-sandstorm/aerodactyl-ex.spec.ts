import {
  AttackAction,
  CardType,
  GameMessage,
  PlayCardAction,
  Simulator,
  SpecialCondition,
  TrainerCard,
  TrainerType,
} from '@ptcg/common';

import { AerodactylEx } from '../../../src/ex-sets/set-sandstorm/aerodactyl-ex';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

class TestTool extends TrainerCard {
  public trainerType: TrainerType = TrainerType.TOOL;
  public set = 'TEST';
  public name = 'Test Tool';
  public fullName = 'Test Tool TEST';
}

describe('Aerodactyl ex SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new AerodactylEx()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  // Primal Lock - As long as Aerodactyl ex is in play, your opponent can't play Pokémon Tool cards.
  it('Should block the opponent from playing Pokémon Tool cards', () => {
    const { opponent } = TestUtils.getAll(sim);
    const tool = new TestTool();
    opponent.hand.cards = [tool];
    TestUtils.setActivePlayer(sim, opponent);

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(2, 0, TestUtils.target(sim, opponent.active, opponent)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.BLOCKED_BY_ABILITY);
    expect(opponent.hand.cards).toEqual([tool]);
    expect(opponent.active.trainers.cards).toEqual([]);
  });

  it('Should block the opponent from playing Pokémon Tool cards when Aerodactyl ex is on the Bench', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new AerodactylEx()]);
    TestUtils.setActive(sim, [new TestPokemon()]);
    const tool = new TestTool();
    opponent.hand.cards = [tool];
    TestUtils.setActivePlayer(sim, opponent);

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(2, 0, TestUtils.target(sim, opponent.active, opponent)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.BLOCKED_BY_ABILITY);
    expect(opponent.hand.cards).toEqual([tool]);
  });

  it('Should not block its owner from playing Pokémon Tool cards', () => {
    const { player } = TestUtils.getAll(sim);
    const tool = new TestTool();
    player.hand.cards = [tool];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.trainers.cards).toEqual([tool]);
    expect(player.hand.cards).toEqual([]);
  });

  it('Should allow the opponent to play Pokémon Tool cards when Primal Lock is blocked', () => {
    const { opponent } = TestUtils.getAll(sim);
    const tool = new TestTool();
    opponent.hand.cards = [tool];
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);
    TestUtils.setActivePlayer(sim, opponent);

    sim.dispatch(new PlayCardAction(2, 0, TestUtils.target(sim, opponent.active, opponent)));

    expect(opponent.active.trainers.cards).toEqual([tool]);
    expect(opponent.hand.cards).toEqual([]);
  });

  // Remove any Pokémon Tool cards attached to your opponent's Pokémon and put them into his or her discard pile.
  it('Should discard Pokémon Tool cards attached to the opponent\'s Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const tool1 = new TestTool();
    const tool2 = new TestTool();
    opponent.active.trainers.cards = [tool1];
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [], [tool2]);
    const ownTool = new TestTool();
    player.bench[1] = TestUtils.pokemonSlot([new TestPokemon()], [], [ownTool]);
    player.hand.cards = [new TestPokemon()];

    // any action triggers the table state check
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.bench[0])));

    expect(opponent.active.trainers.cards).toEqual([]);
    expect(opponent.bench[0].trainers.cards).toEqual([]);
    expect(opponent.discard.cards).toEqual(jasmine.arrayContaining([tool1, tool2]));
    expect(player.bench[1].trainers.cards).toEqual([ownTool]);
  });

  it('Should not discard opponent\'s Pokémon Tool cards when Primal Lock is blocked', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const tool = new TestTool();
    opponent.active.trainers.cards = [tool];
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);
    player.hand.cards = [new TestPokemon()];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.bench[0])));

    expect(opponent.active.trainers.cards).toEqual([tool]);
    expect(opponent.discard.cards).toEqual([]);
  });

  // Supersonic (10) - The Defending Pokémon is now Confused.
  it('Should use Supersonic', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Supersonic'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
  });

  // Wing Attack (60)
  it('Should use Wing Attack', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Wing Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });
});
