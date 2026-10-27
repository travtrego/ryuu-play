import { GameMessage, PlayCardAction, Simulator } from '@ptcg/common';

import { Colress } from '../../../src/standard/set-black-and-white/colress';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Colress PLS', () => {
  let sim: Simulator;
  let trainerCard: Colress;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new Colress();
    const player = sim.store.state.players[0];
    player.hand.cards = [trainerCard, ...TestUtils.makeTestCards(2)];
    player.deck.cards = TestUtils.makeTestCards(20);
  });

  function playCard(): string {
    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Shuffle your hand into your deck. Then, draw a number of cards equal to the number of Benched Pokemon
  // (both yours and your opponent's).
  it('Should draw 1 card per Benched Pokemon on both sides', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.bench[1] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    expect(playCard()).toEqual('');

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards.length).toEqual(3);
    // 20 + 2 shuffled back - 3 drawn
    expect(player.deck.cards.length).toEqual(19);
    expect(player.supporter.cards).toEqual([trainerCard]);
    expect(prompts.some(p => p.type === 'Shuffle deck')).toBeTrue();
  });

  it('Should draw nothing when there are no Benched Pokemon', () => {
    const { player } = TestUtils.getAll(sim);

    expect(playCard()).toEqual('');

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards.length).toEqual(0);
    expect(player.deck.cards.length).toEqual(22);
  });

  it('Should not be playable with an empty hand and an empty deck', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [trainerCard];
    player.deck.cards = [];

    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });
});
