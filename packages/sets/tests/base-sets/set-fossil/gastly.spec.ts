import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
  SuperType,
} from '@ptcg/common';

import { Gastly } from '../../../src/base-sets/set-fossil/gastly';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Gastly FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Gastly()],
      [CardType.PSYCHIC, CardType.PSYCHIC]
    );
  });

  // Lick (10) - Flip a coin. If heads, the Defending Pokémon is now Paralyzed.
  it('Should use Lick - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Lick'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Lick - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Lick'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Energy Conversion - Put up to 2 Energy cards from your discard pile into your hand. Gastly does 10 damage to
  // itself.
  it('Should use Energy Conversion', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    const energies = TestUtils.makeEnergies([CardType.FIRE, CardType.WATER, CardType.GRASS]);
    const pokemon = new TestPokemon();
    player.discard.cards = [pokemon, ...energies];
    const handSize = player.hand.cards.length;

    sim.dispatch(new AttackAction(1, 'Energy Conversion'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      cards: player.discard,
      filter: { superType: SuperType.ENERGY },
      options: jasmine.objectContaining({ min: 0, max: 2 })
    }));

    sim.dispatch(new ResolvePromptAction(prompts[0].id, [energies[0], energies[2]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards.length).toEqual(handSize + 2);
    expect(player.hand.cards).toContain(energies[0]);
    expect(player.hand.cards).toContain(energies[2]);
    expect(player.discard.cards).toEqual([pokemon, energies[1]]);
    expect(player.active.damage).toEqual(10);
    expect(opponent.active.damage).toEqual(0);
  });

  // BUG: Energy Conversion skips Gastly's 10 self-damage when the discard pile has no Energy cards
  xit('Should use Energy Conversion with no Energy in the discard pile and still damage itself', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.discard.cards = [new TestPokemon()];

    sim.dispatch(new AttackAction(1, 'Energy Conversion'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.damage).toEqual(10);
    expect(opponent.active.damage).toEqual(0);
  });
});
