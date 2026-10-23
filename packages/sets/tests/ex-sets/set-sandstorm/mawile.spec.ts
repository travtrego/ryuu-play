import {
  AttackAction,
  CardType,
  GameMessage,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
  SuperType,
  TrainerCard,
  TrainerType,
} from '@ptcg/common';

import { Mawile } from '../../../src/ex-sets/set-sandstorm/mawile';
import { TestCard } from '../../test-cards/test-card';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class TestSupporter extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;
  public set = 'TEST';
  public name = 'Test Supporter';
  public fullName = 'Test Supporter TEST';
}

describe('Mawile SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Mawile()], [CardType.METAL, CardType.COLORLESS]);
  });

  // Scam - Look at your opponent's hand. You may have your opponent shuffle a Supporter card you find there into his
  // or her deck. If you do, your opponent draws a card.
  it('Should use Scam and shuffle a Supporter into the opponent\'s deck', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const supporter = new TestSupporter();
    const card = new TestCard();
    opponent.hand.cards = [card, supporter];
    const deckSize = opponent.deck.cards.length;

    sim.dispatch(new AttackAction(1, 'Scam'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_DECK,
      cards: opponent.hand,
      filter: { superType: SuperType.TRAINER, trainerType: TrainerType.SUPPORTER },
      options: jasmine.objectContaining({ allowCancel: true, min: 1, max: 1 })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [supporter]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    // card + 1 card drawn by Scam + 1 card drawn at the start of the turn
    expect(opponent.hand.cards.length).toEqual(3);
    expect(opponent.hand.cards).toContain(card);
    expect(opponent.deck.cards.length).toEqual(deckSize + 1 - 2);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Scam and decline', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    const supporter = new TestSupporter();
    opponent.hand.cards = [supporter];
    const deckSize = opponent.deck.cards.length;

    sim.dispatch(new AttackAction(1, 'Scam'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.hand.cards[0]).toBe(supporter);
    expect(opponent.deck.cards.length).toEqual(deckSize - 1);
  });

  it('Should use Scam when the opponent has no cards in hand', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    opponent.hand.cards = [];

    sim.dispatch(new AttackAction(1, 'Scam'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
  });

  // Metal Hook (20) - Before doing damage, you may switch 1 of your opponent's Benched Pokémon with 1 of the
  // Defending Pokémon. If you do, this attack does 20 damage to the new Defending Pokémon.
  it('Should use Metal Hook and switch the Defending Pokémon', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();
    const benched = new TestPokemon();
    opponent.bench[0] = TestUtils.pokemonSlot([benched]);

    sim.dispatch(new AttackAction(1, 'Metal Hook'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_SWITCH,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.BENCH],
      options: jasmine.objectContaining({ allowCancel: true })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.getPokemonCard()).toBe(benched);
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.bench[0].getPokemonCard()).toBe(defending);
    expect(opponent.bench[0].damage).toEqual(0);
  });

  it('Should use Metal Hook without switching', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Metal Hook'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.getPokemonCard()).toBe(defending);
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.bench[0].damage).toEqual(0);
  });

  it('Should use Metal Hook when the opponent has no Benched Pokémon', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Metal Hook'));

    expect(prompts.length).toEqual(0);
    expect(opponent.active.damage).toEqual(20);
  });
});
