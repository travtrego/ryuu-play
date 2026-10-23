import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  GameMessage,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Kirlia } from '../../../src/ex-sets/set-ruby-and-sapphire/kirlia';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Kirlia RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Kirlia()], [CardType.PSYCHIC, CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Removal Beam (10) - Flip a coin. If heads, discard 1 Energy card attached to the Defending Pokémon.
  it('Should use Removal Beam - heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);
    TestUtils.setDefending(sim, [new TestPokemon()], [CardType.FIRE, CardType.WATER]);
    const water = opponent.active.energies.cards[1];

    sim.dispatch(new AttackAction(1, 'Removal Beam'));

    const prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_DISCARD,
      cards: opponent.active.energies,
      options: jasmine.objectContaining({ min: 1, max: 1, allowCancel: false }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [water]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.energies.cards.length).toEqual(1);
    expect(opponent.discard.cards).toEqual([water]);
  });

  it('Should use Removal Beam - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);
    TestUtils.setDefending(sim, [new TestPokemon()], [CardType.FIRE, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Removal Beam'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.energies.cards.length).toEqual(2);
  });

  it('Should use Removal Beam - Defending Pokemon has no Energy', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Removal Beam'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  // Super Psy (50)
  it('Should use Super Psy', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Super Psy'));

    expect(opponent.active.damage).toEqual(50);
  });

});
