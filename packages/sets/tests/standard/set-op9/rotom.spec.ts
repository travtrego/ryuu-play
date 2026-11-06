import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  TrainerCard,
  TrainerType,
} from '@ptcg/common';

import { Rotom } from '../../../src/standard/set-op9/rotom';
import { TestCard } from '../../test-cards/test-card';
import { TestUtils } from '../../test-utils';

class TestTrainer extends TrainerCard {
  public trainerType = TrainerType.ITEM;
  public set = 'TEST';
  public name = 'Test Trainer';
  public fullName = 'Test Trainer TEST';
}

class TestSupporter extends TrainerCard {
  public trainerType = TrainerType.SUPPORTER;
  public set = 'TEST';
  public name = 'Test Supporter';
  public fullName = 'Test Supporter TEST';
}

describe('Rotom OP9', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    TestUtils.setActive(sim, [new Rotom()], [CardType.PSYCHIC, CardType.COLORLESS]);
  });

  it('Poltergeist does 10 more damage for each Trainer card in the opponent\'s hand', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    opponent.hand.cards = [new TestTrainer(), new TestCard(), new TestSupporter()];

    sim.dispatch(new AttackAction(1, 'Poltergeist'));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Show cards',
      playerId: player.id,
      message: GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,
    }));

    sim.dispatch(new ResolvePromptAction(prompts[0].id, true));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
  });

  it('Poltergeist does 30 damage when the opponent\'s hand is empty', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    opponent.hand.cards = [];

    sim.dispatch(new AttackAction(1, 'Poltergeist'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });
});
