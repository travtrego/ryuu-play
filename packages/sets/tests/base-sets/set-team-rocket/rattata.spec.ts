import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
  UseAbilityAction,
} from '@ptcg/common';

import { Rattata } from '../../../src/base-sets/set-team-rocket/rattata';
import { TestCard } from '../../test-cards/test-card';
import { TestUtils } from '../../test-utils';

describe('Rattata TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Rattata()], [CardType.COLORLESS]);
  });

  function useTrickery(): string {
    const { player } = TestUtils.getAll(sim);
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Trickery', TestUtils.target(sim, player.active)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Trickery - Once during your turn (before your attack), you may switch 1 of your Prizes with the top card of
  // your deck. This power can't be used if Rattata is Asleep, Confused, or Paralyzed.
  it('Should use Trickery to switch a Prize with the top card of the deck', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const prize = player.prizes[2].cards[0];
    const top = new TestCard();
    player.deck.cards.unshift(top);

    expect(useTrickery()).toEqual('');
    expect(prompts[0]).toEqual(jasmine.objectContaining({ type: 'Choose prize', playerId: player.id }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.prizes[2]]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.prizes[2].cards).toEqual([top]);
    expect(player.deck.cards[0]).toBe(prize);
    expect(player.deck.cards.length).toEqual(51);
    expect(player.getPrizeLeft()).toEqual(6);
  });

  it('Should use Trickery only once per turn', () => {
    const { prompts, player } = TestUtils.getAll(sim);

    useTrickery();
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.prizes[0]]));

    expect(useTrickery()).toEqual(GameMessage.POWER_ALREADY_USED);
  });

  [SpecialCondition.ASLEEP, SpecialCondition.CONFUSED, SpecialCondition.PARALYZED].forEach(condition => {
    it(`Should not use Trickery when Rattata is ${SpecialCondition[condition]}`, () => {
      const { player, prompts } = TestUtils.getAll(sim);
      player.active.addSpecialCondition(condition);

      expect(useTrickery()).toEqual(GameMessage.CANNOT_USE_POWER);
      expect(prompts.length).toEqual(0);
    });
  });

  // Quick Attack (10+) - Flip a coin. If heads, this attack does 10 damage plus 10 more damage; if tails, this
  // attack does 10 damage.
  it('Should use Quick Attack - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Quick Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Quick Attack - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Quick Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });
});
