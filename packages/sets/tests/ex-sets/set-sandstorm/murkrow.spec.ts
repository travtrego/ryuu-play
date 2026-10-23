import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { Murkrow } from '../../../src/ex-sets/set-sandstorm/murkrow';
import { TestCard } from '../../test-cards/test-card';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Murkrow SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Murkrow()], [CardType.DARK, CardType.COLORLESS]);
  });

  // Surprise - Choose 1 card from your opponent's hand without looking. Look at the card you chose, then have your
  // opponent shuffle that card into his or her deck.
  it('Should use Surprise', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const card = new TestCard();
    opponent.hand.cards = [card];
    const deckSize = opponent.deck.cards.length;

    sim.dispatch(new AttackAction(1, 'Surprise'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_DECK,
      cards: opponent.hand,
      options: jasmine.objectContaining({ isSecret: true })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [card]));
    expect(prompts[1]).toEqual(jasmine.objectContaining({ type: 'Show cards', playerId: player.id, cards: [card] }));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, true));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.hand.cards.length).toEqual(1);
    expect(opponent.deck.cards.length).toEqual(deckSize);
  });

  // Dark Mind (20) - Does 10 damage to 1 of your opponent's Benched Pokémon. (Don't apply Weakness and Resistance
  // for Benched Pokémon.)
  it('Should use Dark Mind', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const benched = new TestPokemon();
    benched.weakness = [{ type: CardType.DARK }];
    opponent.bench[0] = TestUtils.pokemonSlot([benched]);

    sim.dispatch(new AttackAction(1, 'Dark Mind'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
      slots: [SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.bench[0].damage).toEqual(10);
  });

  it('Should use Dark Mind without opponent\'s Benched Pokémon', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Dark Mind'));

    expect(prompts.length).toEqual(0);
    expect(opponent.active.damage).toEqual(20);
  });
});
