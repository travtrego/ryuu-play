import {
  CardManager,
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
  SlotType,
  TrainerCard,
} from '@ptcg/common';

import { AggronEx } from '../../../src/ex-sets/set-sandstorm/aggron-ex';
import { Aron } from '../../../src/ex-sets/set-sandstorm/aron';
import { Lairon } from '../../../src/ex-sets/set-sandstorm/lairon';
import { RareCandy } from '../../../src/ex-sets/set-sandstorm/rare-candy';
import { TestUtils } from '../../test-utils';

describe('Rare Candy SS', () => {
  let sim: Simulator;
  let trainerCard: TrainerCard;
  let aron: Aron;

  beforeAll(() => {
    const cm = CardManager.getInstance();
    if (!cm.isCardDefined('Lairon SS')) {
      cm.defineSet([new Lairon()]);
    }
  });

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 3;
    trainerCard = new RareCandy();
    aron = new Aron();
    TestUtils.setActive(sim, [aron]);
  });

  // Choose 1 of your Basic Pokémon in play. If you have a Stage 1 or Stage 2 card that evolves from that Pokémon in
  // your hand, put that card on the Basic Pokémon. (This counts as evolving that Pokémon.)
  it('Should evolve a Basic Pokémon directly into a Stage 2', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const aggron = new AggronEx();
    player.hand.cards = [trainerCard, aggron];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_EVOLVE,
      slots: [SlotType.ACTIVE, SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.active]));

    expect(prompts[1]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_EVOLVE,
      cards: player.hand,
    }));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [aggron]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.pokemons.cards).toEqual([aron, aggron]);
    expect(player.hand.cards).toEqual([]);
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should keep Rare Candy in hand when the evolution is cancelled', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const aggron = new AggronEx();
    player.hand.cards = [trainerCard, aggron];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.pokemons.cards).toEqual([aron]);
    expect(player.hand.cards).toEqual([trainerCard, aggron]);
  });

  it('Should not evolve a Basic Pokémon played this turn', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [trainerCard, new AggronEx()];
    player.active.pokemonPlayedTurn = 3;

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.active.pokemons.cards).toEqual([aron]);
  });

  it('Should not be played without an Evolution card in hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [trainerCard];

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards).toEqual([trainerCard]);
  });

  // BUG: this Rare Candy's text allows a Stage 1 card ("Stage 1 or Stage 2 card that evolves from that Pokémon"), but
  // the implementation reuses the Stage 2-only common Rare Candy and refuses to be played with only a Stage 1.
  xit('Should evolve a Basic Pokémon into a Stage 1', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const lairon = new Lairon();
    player.hand.cards = [trainerCard, lairon];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.active]));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [lairon]));

    expect(player.active.pokemons.cards).toEqual([aron, lairon]);
    expect(player.discard.cards).toEqual([trainerCard]);
  });
});
