import {
  CardType,
  EnergyType,
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
  SuperType,
} from '@ptcg/common';

import { EnergySearch } from '../../../src/base-sets/set-fossil/energy-search';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Energy Search FO', () => {
  let sim: Simulator;
  let trainerCard: EnergySearch;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new EnergySearch();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  // Search your deck for a basic Energy card and put it into your hand. Shuffle your deck afterward.
  it('Should put a basic Energy card from the deck into hand', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const [energy] = TestUtils.makeEnergies([CardType.FIRE]);
    const pokemon = new TestPokemon();
    player.deck.cards = [pokemon, energy];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      cards: player.deck,
      filter: { superType: SuperType.ENERGY, energyType: EnergyType.BASIC },
      options: jasmine.objectContaining({ min: 1, max: 1 })
    }));

    sim.dispatch(new ResolvePromptAction(prompts[0].id, [energy]));

    const show = TestUtils.lastPrompt(sim);
    if (show && show.type === 'Show cards' && show.result === undefined) {
      expect(show.playerId).toEqual(opponent.id);
      sim.dispatch(new ResolvePromptAction(show.id, true));
    }

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([energy]);
    expect(player.deck.cards).toEqual([pokemon]);
    expect(player.discard.cards).toEqual([trainerCard]);
    expect(prompts.some(p => p.type === 'Shuffle deck')).toBeTrue();
  });

  it('Should not be playable with an empty deck', () => {
    let message = '';
    sim.store.state.players[0].deck.cards = [];
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    const { player } = TestUtils.getAll(sim);
    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards.length).toEqual(1);
    expect(player.hand.cards[0].name).toEqual('Energy Search');
  });
});
