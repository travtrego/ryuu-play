import {
  AttackAction,
  CardType,
  ChoosePokemonPrompt,
  GameMessage,
  PlayerType,
  PokemonCard,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { Seaking } from '../../../src/ex-sets/set-ruby-and-sapphire/seaking';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Seaking RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Seaking()], [CardType.WATER, CardType.COLORLESS]);
  });

  // Water Arrow - Choose 1 of your opponent's Pokémon. This attack does 20 damage to that Pokémon. (Don't apply
  // Weakness and Resistance for Benched Pokémon.)
  it('Should use Water Arrow - Benched Pokemon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const benched = new TestPokemon();
    benched.weakness = [{ type: CardType.WATER }];
    opponent.bench[0] = TestUtils.pokemonSlot([benched]);

    sim.dispatch(new AttackAction(1, 'Water Arrow'));

    const prompt = TestUtils.lastPrompt(sim) as ChoosePokemonPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.ACTIVE, SlotType.BENCH],
      options: jasmine.objectContaining({ allowCancel: false }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.bench[0].damage).toEqual(20);
  });

  it('Should use Water Arrow - Active Pokemon, Weakness applied', () => {
    const { opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as PokemonCard).weakness = [{ type: CardType.WATER }];

    sim.dispatch(new AttackAction(1, 'Water Arrow'));

    const prompt = TestUtils.lastPrompt(sim) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.active]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });

  // Fast Stream (30) - Move 1 Energy card attached to the Defending Pokémon to the other Defending Pokémon. (Ignore
  // this effect if your opponent has only 1 Defending Pokémon.)
  it('Should use Fast Stream - single Defending Pokemon', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestPokemon()], [CardType.FIRE]);

    sim.dispatch(new AttackAction(1, 'Fast Stream'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.active.energies.cards.length).toEqual(1);
  });

});
