import {
  AttackAction,
  CardType,
  GameMessage,
  Simulator,
  SpecialCondition,
  UseAbilityAction,
} from '@ptcg/common';

import { Omanyte } from '../../../src/base-sets/set-fossil/omanyte';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Omanyte FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Omanyte()],
      [CardType.WATER]
    );
  });

  function useClairvoyance(): string {
    const { player } = TestUtils.getAll(sim);
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Clairvoyance', TestUtils.target(sim, player.active)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Clairvoyance - Your opponent plays with his or her hand face up. This power stops working while Omanyte is
  // Asleep, Confused, or Paralyzed.
  it('Should reveal the opponent\'s hand with Clairvoyance', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    opponent.hand.cards = TestUtils.makeTestCards(3);

    expect(useClairvoyance()).toEqual('');

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Show cards',
      playerId: player.id,
      message: GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,
      cards: opponent.hand.cards,
    }));
  });

  [SpecialCondition.ASLEEP, SpecialCondition.CONFUSED, SpecialCondition.PARALYZED].forEach(condition => {
    it(`Should not use Clairvoyance while Omanyte is ${SpecialCondition[condition]}`, () => {
      const { player, opponent } = TestUtils.getAll(sim);
      opponent.hand.cards = TestUtils.makeTestCards(3);
      player.active.specialConditions.push(condition);

      expect(useClairvoyance()).toEqual(GameMessage.CANNOT_USE_POWER);
    });
  });

  it('Should not use Clairvoyance when Pokémon Powers are blocked', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.hand.cards = TestUtils.makeTestCards(3);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    expect(useClairvoyance()).toEqual(GameMessage.BLOCKED_BY_ABILITY);
  });

  // Water Gun (10+) - Does 10 damage plus 10 more damage for each W Energy attached to Omanyte but not used to pay
  // for this attack's Energy cost. You can't add more than 20 damage in this way.
  it('Should use Water Gun - no extra Energy', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should use Water Gun - 1 extra Water Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Omanyte()], [CardType.WATER, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Water Gun - capped at 20 extra damage', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Omanyte()], [CardType.WATER, CardType.WATER, CardType.WATER, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(opponent.active.damage).toEqual(30);
  });
});
