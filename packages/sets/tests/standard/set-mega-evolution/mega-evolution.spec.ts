import {
  CardType,
  EndTurnEffect,
  CheckTableStateEffect,
  PlayCardAction,
  PlayStadiumEffect,
  PlayerType,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { BossOrdersMEG } from '../../../src/standard/set-mega-evolution/boss-orders';
import { RiskyRuins } from '../../../src/standard/set-mega-evolution/risky-ruins';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class DarkPokemon extends TestPokemon {
  public cardTypes = [CardType.DARK];
}

describe('Mega Evolution cards', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  it('Boss\'s Orders MEG keeps the Boss\'s Orders effect and its own name', () => {
    const card = new BossOrdersMEG();
    expect(card.name).toEqual('Boss\'s Orders');
    expect(card.fullName).toEqual('Boss\'s Orders MEG');
  });

  describe('Risky Ruins MEG', () => {
    let ruins: RiskyRuins;

    beforeEach(() => {
      const { player } = TestUtils.getAll(sim);
      ruins = new RiskyRuins();
      player.bench[0].pokemons.cards = [new TestPokemon()]; // already in play
      player.stadium.cards = [ruins];
      // Only the card's own reaction: the engine's stadium handling is not under test here.
      ruins.reduceEffect(sim.store, sim.store.state, new PlayStadiumEffect(player, ruins));
    });

    function check() {
      sim.store.reduceEffect(sim.store.state, new CheckTableStateEffect());
    }

    it('places 2 damage counters on a Basic non-D Pokémon put onto the Bench', () => {
      const { player } = TestUtils.getAll(sim);
      player.hand.cards = [new TestPokemon()];
      sim.dispatch(new PlayCardAction(1, 0, { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 1 }));
      expect(player.bench[1].damage).toEqual(20);
      check();
      expect(player.bench[1].damage).toEqual(20); // only once
      expect(player.bench[0].damage).toEqual(0); // was there before
    });

    it('does not affect a D Pokémon', () => {
      const { player } = TestUtils.getAll(sim);
      player.hand.cards = [new DarkPokemon()];
      sim.dispatch(new PlayCardAction(1, 0, { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 1 }));
      expect(player.bench[1].damage).toEqual(0);
    });

    it('Pokémon already in play when a turn begins are not affected', () => {
      const { player } = TestUtils.getAll(sim);
      ruins.reduceEffect(sim.store, sim.store.state, new EndTurnEffect(player));
      player.bench[2].pokemons.cards = [new TestPokemon()];
      check();
      expect(player.bench[2].damage).toEqual(20);
      ruins.reduceEffect(sim.store, sim.store.state, new EndTurnEffect(player));
      check();
      expect(player.bench[2].damage).toEqual(20);
    });
  });
});
