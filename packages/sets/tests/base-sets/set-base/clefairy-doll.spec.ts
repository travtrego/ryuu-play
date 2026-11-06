import {
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  RetreatAction,
  Simulator,
  UseTrainerInPlayAction,
  AttackAction,
} from '@ptcg/common';

import { ClefairyDoll } from '../../../src/base-sets/set-base/clefairy-doll';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Clefairy Doll BS', () => {
  let sim: Simulator;
  let trainerCard: ClefairyDoll;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new ClefairyDoll();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  it('Should be played onto the Bench as if it were a Basic Pokémon', () => {
    const { player } = TestUtils.getAll(sim);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.bench[0])));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.bench[0].getPokemonCard()).toBe(trainerCard as any);
    expect(player.hand.cards).toEqual([]);
    expect(player.discard.cards).toEqual([]);
  });

  it('Should not be played onto an occupied slot', () => {
    const { player } = TestUtils.getAll(sim);

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards).toEqual([trainerCard]);
  });

  it('Should not be able to retreat', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [];
    player.active = TestUtils.pokemonSlot([trainerCard as any]);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    const active = player.active;

    let message = '';
    try {
      sim.dispatch(new RetreatAction(1, 0));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).not.toEqual('');
    expect(player.active).toBe(active);
    expect(player.active.getPokemonCard()).toBe(trainerCard as any);
  });

  it('Should be discarded at any time during your turn', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.hand.cards = [];
    player.bench[0] = TestUtils.pokemonSlot([trainerCard as any]);

    sim.dispatch(new UseTrainerInPlayAction(1, TestUtils.target(sim, player.bench[0]), 'Clefairy Doll'));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({ type: 'Confirm', playerId: player.id }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, true));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.bench[0].pokemons.cards).toEqual([]);
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should not give a Prize card when Knocked Out', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    player.hand.cards = [];
    player.active = TestUtils.pokemonSlot([trainerCard as any]);
    const benched = TestUtils.pokemonSlot([new TestPokemon()]);
    player.bench[0] = benched;
    TestUtils.setActivePlayer(sim, opponent);

    // Opponent's Test attack does 10 damage, Clefairy Doll has 10 HP
    sim.dispatch(new AttackAction(2, 'Test attack'));

    // Only prompt: player chooses a new Active Pokémon, no prize for the opponent
    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      playerId: player.id,
      message: GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [benched]));

    expect(player.discard.cards).toEqual([trainerCard]);
    expect(player.active).toBe(benched);
    expect(opponent.prizes.every(p => p.cards.length === 1)).toBeTrue();
  });
});
