import {
  CardManager,
  CardType,
  GameMessage,
  PlayCardAction,
  PokemonCard,
  ResolvePromptAction,
  Simulator,
  Stage,
} from '@ptcg/common';

import { Evosoda } from '../../../src/standard/set-black-and-white-2/evosoda';
import { TestCard } from '../../test-cards/test-card';
import { TestUtils } from '../../test-utils';

class EvosodaBasic extends PokemonCard {
  public stage = Stage.BASIC;
  public cardTypes = [CardType.COLORLESS];
  public hp = 60;
  public set = 'TEST';
  public name = 'Evosoda Basic';
  public fullName = 'Evosoda Basic TEST';
}

class EvosodaStage1 extends PokemonCard {
  public stage = Stage.STAGE_1;
  public evolvesFrom = 'Evosoda Basic';
  public cardTypes = [CardType.COLORLESS];
  public hp = 90;
  public set = 'TEST';
  public name = 'Evosoda Stage1';
  public fullName = 'Evosoda Stage1 TEST';
}

describe('Evosoda XY', () => {
  let sim: Simulator;
  let trainerCard: Evosoda;

  beforeAll(() => {
    const cm = CardManager.getInstance();
    if (!cm.isCardDefined('Evosoda Stage1 TEST')) {
      cm.defineSet([new EvosodaBasic(), new EvosodaStage1()]);
    }
  });

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new Evosoda();
    const state = sim.store.state;
    state.turn = 3;
    state.players[0].hand.cards = [trainerCard];
    TestUtils.setActive(sim, [new EvosodaBasic()]);
    state.players[0].active.pokemonPlayedTurn = 1;
  });

  it('Should evolve a Pokémon from the deck and shuffle the deck afterward', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const evolution = new EvosodaStage1();
    const other = new TestCard();
    player.deck.cards = [evolution, other];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_EVOLVE,
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [evolution]));

    expect(prompts[1]).toEqual(jasmine.objectContaining({
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_EVOLVE,
    }));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [player.active]));

    expect(prompts[2]).toEqual(jasmine.objectContaining({ type: 'Shuffle deck', playerId: player.id }));
    expect(player.active.getPokemonCard()).toBe(evolution);
    expect(player.deck.cards).toEqual([other]);
    expect(player.discard.cards).toEqual([trainerCard]);
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
  });

  it('Should still shuffle the deck when the search is canceled', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.deck.cards = [new EvosodaStage1(), new TestCard()];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(prompts[1]).toEqual(jasmine.objectContaining({ type: 'Shuffle deck', playerId: player.id }));
    expect(player.active.getPokemonCard()).toEqual(jasmine.any(EvosodaBasic));
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
  });
});
