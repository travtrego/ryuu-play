import {
  CardType,
  CheckRetreatCostEffect,
  GameMessage,
  Simulator,
  Stage,
  UseStadiumAction,
} from '@ptcg/common';

import { SkyarrowBridge } from '../../../src/standard/set-black-and-white/skyarrow-bridge';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Skyarrow Bridge NXD', () => {
  let sim: Simulator;
  let pokemonCard: TestPokemon;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.players[0].stadium.cards = [new SkyarrowBridge()];
    pokemonCard = new TestPokemon();
    TestUtils.setActive(sim, [pokemonCard]);
  });

  function retreatCost(): CardType[] {
    const { player } = TestUtils.getAll(sim);
    const effect = new CheckRetreatCostEffect(player);
    sim.store.reduceEffect(sim.store.state, effect);
    return effect.cost;
  }

  // The Retreat Cost of each Basic Pokemon in play is C less.
  it('Should reduce the Retreat Cost of a Basic Pokemon by 1 Colorless', () => {
    pokemonCard.retreat = [CardType.COLORLESS, CardType.COLORLESS];

    expect(retreatCost()).toEqual([CardType.COLORLESS]);
  });

  it('Should leave a free Retreat Cost unchanged', () => {
    pokemonCard.retreat = [];

    expect(retreatCost()).toEqual([]);
  });

  it('Should not reduce the Retreat Cost of an evolved Pokemon', () => {
    const basic = new TestPokemon();
    const evolved = new TestPokemon();
    evolved.stage = Stage.STAGE_1;
    evolved.retreat = [CardType.COLORLESS, CardType.COLORLESS];
    TestUtils.setActive(sim, [basic, evolved]);

    expect(retreatCost()).toEqual([CardType.COLORLESS, CardType.COLORLESS]);
  });

  it('Should not be usable as a Stadium effect', () => {
    const { player } = TestUtils.getAll(sim);
    player.stadiumUsedTurn = -1;
    let message = '';
    try {
      sim.dispatch(new UseStadiumAction(1));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_USE_STADIUM);
  });
});
