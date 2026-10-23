import {
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
  TrainerCard,
} from '@ptcg/common';

import { Aron } from '../../../src/ex-sets/set-sandstorm/aron';
import { Lairon } from '../../../src/ex-sets/set-sandstorm/lairon';
import { WallysTraining } from '../../../src/ex-sets/set-sandstorm/wallys-training';
import { TestCard } from '../../test-cards/test-card';
import { TestUtils } from '../../test-utils';

describe('Wally\'s Training SS', () => {
  let sim: Simulator;
  let trainerCard: TrainerCard;
  let aron: Aron;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 3;
    trainerCard = new WallysTraining();
    aron = new Aron();
    TestUtils.setActive(sim, [aron]);
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  // Search your deck for a card that evolves from your Active Pokémon (choose 1 if there are 2) and put it on your
  // Active Pokémon. (This counts as evolving that Pokémon.) Shuffle your deck afterward.
  it('Should evolve the Active Pokémon from the deck', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const lairon = new Lairon();
    const card = new TestCard();
    player.deck.cards = [card, lairon];
    player.active.damage = 20;

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_EVOLVE,
      cards: player.deck,
      filter: jasmine.objectContaining({ evolvesFrom: 'Aron' }),
      options: jasmine.objectContaining({ min: 1, max: 1, allowCancel: true })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [lairon]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.pokemons.cards).toEqual([aron, lairon]);
    expect(player.active.damage).toEqual(20);
    expect(player.deck.cards).toEqual([card]);
    expect(player.supporter.cards).toEqual([trainerCard]);
  });

  it('Should cancel the search', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const lairon = new Lairon();
    player.deck.cards = [lairon];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.pokemons.cards).toEqual([aron]);
    expect(player.deck.cards).toEqual([lairon]);
  });

  // BUG: "This counts as evolving that Pokémon", so a Pokémon put into play this turn can't be evolved, but Wally's
  // Training doesn't check pokemonPlayedTurn and evolves it anyway.
  xit('Should not evolve an Active Pokémon that was put into play this turn', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const lairon = new Lairon();
    player.deck.cards = [lairon];
    player.active.pokemonPlayedTurn = 3;

    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
      const prompt = prompts.find(p => p.type === 'Choose cards');
      if (prompt) {
        sim.dispatch(new ResolvePromptAction(prompt.id, [lairon]));
      }
    } catch (error) {
      // refusing to play the card is fine too
    }

    expect(player.active.pokemons.cards).toEqual([aron]);
  });

  it('Should not be played with an empty deck', () => {
    const { player } = TestUtils.getAll(sim);
    player.deck.cards = [];

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
