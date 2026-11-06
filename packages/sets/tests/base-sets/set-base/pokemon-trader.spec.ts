import {
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { PokemonTrader } from '../../../src/base-sets/set-base/pokemon-trader';
import { Abra } from '../../../src/base-sets/set-base/abra';
import { Charmander } from '../../../src/base-sets/set-base/charmander';
import { Charmeleon } from '../../../src/base-sets/set-base/charmeleon';
import { FireEnergy } from '../../../src/base-sets/set-base/fire-energy';
import { TestCard } from '../../test-cards/test-card';
import { TestUtils } from '../../test-utils';

describe('Pokemon Trader BS', () => {
  let sim: Simulator;
  let trainerCard: PokemonTrader;
  let charmander: Charmander;
  let charmeleon: Charmeleon;
  let abra: Abra;
  let other: TestCard;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new PokemonTrader();
    charmander = new Charmander();
    charmeleon = new Charmeleon();
    abra = new Abra();
    other = new TestCard();
    const player = sim.store.state.players[0];
    player.hand.cards = [trainerCard, charmander];
    player.deck.cards = [abra, other, charmeleon];
  });

  it('Should trade a Pokémon from hand for a Pokémon from the deck, show both and shuffle', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_DECK,
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [charmander]));

    expect(prompts[1]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      cards: player.deck,
    }));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [charmeleon]));

    expect(prompts[2]).toEqual(jasmine.objectContaining({
      type: 'Show cards',
      playerId: opponent.id,
      cards: [charmander, charmeleon],
    }));
    sim.dispatch(new ResolvePromptAction(prompts[2].id, true));

    expect(prompts[3]).toEqual(jasmine.objectContaining({ type: 'Shuffle deck', playerId: player.id }));
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([charmeleon]);
    expect(player.deck.cards).toEqual(jasmine.arrayWithExactContents([abra, other, charmander]));
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should not be playable without a Pokémon card in hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [trainerCard, new FireEnergy()];

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards.length).toEqual(2);
  });

  it('Should keep everything in hand when cancelled', () => {
    const { player, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([trainerCard, charmander]);
    expect(player.deck.cards).toEqual([abra, other, charmeleon]);
  });
});
