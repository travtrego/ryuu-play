import { AttackAction, CardType, Simulator } from '@ptcg/common';

import { Durant } from '../../../src/standard/set-black-and-white/durant';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Durant NV', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Durant()],
      [CardType.METAL, CardType.COLORLESS]
    );
  });

  // Devour - For each of your Durant in play, discard the top card of your opponent's deck.
  it('Should use Devour and discard 1 card for a single Durant', () => {
    const { opponent } = TestUtils.getAll(sim);
    const deckBefore = opponent.deck.cards.length;
    const top = opponent.deck.cards[0];

    sim.dispatch(new AttackAction(1, 'Devour'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    // -1 Devour, -1 the opponent's draw at the start of their turn
    expect(opponent.deck.cards.length).toEqual(deckBefore - 2);
    expect(opponent.discard.cards).toEqual([top]);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Devour and discard 1 card per Durant in play', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new Durant()]);
    player.bench[1] = TestUtils.pokemonSlot([new Durant()]);
    player.bench[2] = TestUtils.pokemonSlot([new TestPokemon()]);
    const deckBefore = opponent.deck.cards.length;

    sim.dispatch(new AttackAction(1, 'Devour'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    // -3 Devour (3 Durant in play), -1 the opponent's draw at the start of their turn
    expect(opponent.deck.cards.length).toEqual(deckBefore - 4);
    expect(opponent.discard.cards.length).toEqual(3);
  });

  // Vice Grip (30)
  it('Should use Vice Grip for 30 damage', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Vice Grip'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });
});
