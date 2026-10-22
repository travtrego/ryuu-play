import {
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
  Stage,
  SuperType,
} from '@ptcg/common';

import { PokemonFlute } from '../../../src/base-sets/set-base/pokemon-flute';
import { Charmander } from '../../../src/base-sets/set-base/charmander';
import { Charmeleon } from '../../../src/base-sets/set-base/charmeleon';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Pokemon Flute BS', () => {
  let sim: Simulator;
  let trainerCard: PokemonFlute;
  let charmander: Charmander;
  let charmeleon: Charmeleon;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new PokemonFlute();
    charmander = new Charmander();
    charmeleon = new Charmeleon();
    const state = sim.store.state;
    state.players[0].hand.cards = [trainerCard];
    state.players[1].discard.cards = [charmeleon, charmander];
  });

  it('Should put a Basic Pokémon from the opponent\'s discard pile onto their Bench', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_PUT_ONTO_BENCH,
      cards: opponent.discard,
      filter: { superType: SuperType.POKEMON, stage: Stage.BASIC },
      options: jasmine.objectContaining({ min: 1, max: 1 }),
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [charmander]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.bench[0].pokemons.cards).toEqual([charmander]);
    expect(opponent.discard.cards).toEqual([charmeleon]);
    expect(player.bench[0].pokemons.cards).toEqual([]);
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should not be playable when the opponent\'s Bench is full', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    for (let i = 0; i < 5; i++) {
      opponent.bench[i] = TestUtils.pokemonSlot([new TestPokemon()]);
    }

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards).toEqual([trainerCard]);
  });

  it('Should not be playable without a Basic Pokémon in the opponent\'s discard pile', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.discard.cards = [charmeleon];
    player.discard.cards = [new Charmander()];

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards).toEqual([trainerCard]);
  });
});
