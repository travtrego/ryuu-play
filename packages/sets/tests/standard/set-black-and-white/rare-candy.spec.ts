import {
  CardManager,
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { Emboar } from '../../../src/standard/set-black-and-white/emboar';
import { Pignite } from '../../../src/standard/set-black-and-white/pignite';
import { RareCandy } from '../../../src/standard/set-black-and-white/rare-candy';
import { Tepig } from '../../../src/standard/set-black-and-white/tepig';
import { TestUtils } from '../../test-utils';

describe('Rare Candy SUM', () => {
  let sim: Simulator;
  let trainerCard: RareCandy;
  let tepig: Tepig;

  beforeAll(() => {
    const cm = CardManager.getInstance();
    if (!cm.isCardDefined('Pignite BW')) {
      cm.defineSet([new Pignite()]);
    }
  });

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 3;
    trainerCard = new RareCandy();
    tepig = new Tepig();
    TestUtils.setActive(sim, [tepig]);
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

  // Choose 1 of your Basic Pokemon in play. If you have a Stage 2 card in your hand that evolves from that
  // Pokemon, put that card onto the Basic Pokemon to evolve it. You can't use this card during your first turn
  // or on a Basic Pokemon that was put into play this turn.
  it('Should evolve a Basic Pokemon directly into a Stage 2', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const emboar = new Emboar();
    player.hand.cards = [trainerCard, emboar];

    expect(playCard()).toEqual('');

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
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [emboar]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.pokemons.cards).toEqual([tepig, emboar]);
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should keep Rare Candy in hand when the evolution is canceled', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const emboar = new Emboar();
    player.hand.cards = [trainerCard, emboar];

    expect(playCard()).toEqual('');
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.pokemons.cards).toEqual([tepig]);
    expect(player.hand.cards).toEqual([trainerCard, emboar]);
  });

  it('Should not evolve a Basic Pokemon put into play this turn', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [trainerCard, new Emboar()];
    player.active.pokemonPlayedTurn = 3;

    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.active.pokemons.cards).toEqual([tepig]);
  });

  it('Should not be playable without a Stage 2 in hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [trainerCard, new Pignite()];

    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });

  it('Should not be playable when the Stage 2 does not evolve from the Basic in play', () => {
    const { player } = TestUtils.getAll(sim);
    const unrelated = new Emboar();
    unrelated.evolvesFrom = 'Prinplup';
    player.hand.cards = [trainerCard, unrelated];

    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });
});
