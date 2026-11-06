import {
  CardManager,
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { PokemonBreeder } from '../../../src/base-sets/set-base/pokemon-breeder';
import { Charizard } from '../../../src/base-sets/set-base/charizard';
import { Charmander } from '../../../src/base-sets/set-base/charmander';
import { Charmeleon } from '../../../src/base-sets/set-base/charmeleon';
import { TestCard } from '../../test-cards/test-card';
import { TestUtils } from '../../test-utils';

describe('Pokemon Breeder BS', () => {
  let sim: Simulator;
  let trainerCard: PokemonBreeder;
  let charmander: Charmander;
  let charizard: Charizard;

  beforeAll(() => {
    const cm = CardManager.getInstance();
    if (!cm.isCardDefined('Charmeleon BS')) {
      cm.defineSet([new Charmeleon()]);
    }
  });

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    const state = sim.store.state;
    state.turn = 3;
    trainerCard = new PokemonBreeder();
    charmander = new Charmander();
    charizard = new Charizard();
    state.players[0].hand.cards = [trainerCard, charizard];
    TestUtils.setActive(sim, [charmander]);
    state.players[0].active.pokemonPlayedTurn = 1;
  });

  it('Should put a Stage 2 card from hand on the matching Basic Pokémon', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.active.damage = 20;

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_EVOLVE,
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.active]));

    expect(prompts[1]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_EVOLVE,
    }));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [charizard]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.pokemons.cards).toEqual([charmander, charizard]);
    expect(player.active.damage).toEqual(20);
    expect(player.hand.cards).toEqual([]);
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should not be playable on a Pokémon put into play this turn', () => {
    const { player, state } = TestUtils.getAll(sim);
    player.active.pokemonPlayedTurn = state.turn;

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards).toEqual([trainerCard, charizard]);
  });

  it('Should not be playable without a matching Stage 2 card in hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [trainerCard, new TestCard()];

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards.length).toEqual(2);
  });
});
