import {
  CardType,
  ChooseCardsPrompt,
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
  Stage,
  SuperType,
  TrainerCard,
} from '@ptcg/common';

import { LanettesNetSearch } from '../../../src/ex-sets/set-sandstorm/lanettes-net-search';
import { TestCard } from '../../test-cards/test-card';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

function makeBasic(cardType: CardType): TestPokemon {
  const pokemon = new TestPokemon();
  pokemon.cardTypes = [cardType];
  return pokemon;
}

describe('Lanette\'s Net Search SS', () => {
  let sim: Simulator;
  let trainerCard: TrainerCard;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new LanettesNetSearch();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  // Search your deck for up to 3 different types of Basic Pokémon cards (excluding Baby Pokémon), show them to your
  // opponent, and put them into your hand. Shuffle your deck afterward.
  it('Should search for up to 3 Basic Pokémon of different types', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const fire = makeBasic(CardType.FIRE);
    const water = makeBasic(CardType.WATER);
    const grass = makeBasic(CardType.GRASS);
    const card = new TestCard();
    player.deck.cards = [fire, card, water, grass];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      cards: player.deck,
      filter: { superType: SuperType.POKEMON, stage: Stage.BASIC },
      options: jasmine.objectContaining({ min: 0, max: 3, allowCancel: true, differentTypes: true })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [fire, water, grass]));

    expect(prompts[1]).toEqual(jasmine.objectContaining({
      type: 'Show cards',
      playerId: opponent.id,
      cards: [fire, water, grass]
    }));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, true));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([fire, water, grass]);
    expect(player.deck.cards).toEqual([card]);
    expect(player.supporter.cards).toEqual([trainerCard]);
  });

  it('Should reject 2 Basic Pokémon of the same type', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const fire1 = makeBasic(CardType.FIRE);
    const fire2 = makeBasic(CardType.FIRE);
    const water = makeBasic(CardType.WATER);
    player.deck.cards = [fire1, fire2, water];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    const prompt = prompts[0] as ChooseCardsPrompt;
    expect(prompt.validate([fire1, fire2])).toBeFalse();
    expect(prompt.validate([fire1, water])).toBeTrue();
  });

  it('Should cancel the search', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const fire = makeBasic(CardType.FIRE);
    player.deck.cards = [fire];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.deck.cards).toEqual([fire]);
    expect(player.hand.cards).not.toContain(fire);
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
