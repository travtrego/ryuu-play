import {
  AttackAction,
  CardType,
  ChooseEnergyPrompt,
  Effect,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
  State,
  StoreLike,
  SuperType,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

import { Sableye } from '../../../src/ex-sets/set-sandstorm/sableye';
import { TestCard } from '../../test-cards/test-card';
import { TestUtils } from '../../test-utils';

// Supporter: Draw 2 cards.
class TestDrawSupporter extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;
  public set = 'TEST';
  public name = 'Draw Supporter';
  public fullName = 'Draw Supporter TEST';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      effect.player.deck.moveTo(effect.player.hand, 2);
    }
    return state;
  }
}

describe('Sableye SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Sableye()], [CardType.DARK, CardType.COLORLESS]);
  });

  // Supernatural - Look at your opponent's hand. You may use the effect of a Supporter card you find there as the
  // effect of this attack. (The Supporter card remains in your opponent's hand.)
  it('Should use Supernatural and copy a Supporter effect', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const supporter = new TestDrawSupporter();
    const card = new TestCard();
    opponent.hand.cards = [card, supporter];
    const opponentDeckSize = opponent.deck.cards.length;

    sim.dispatch(new AttackAction(1, 'Supernatural'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_COPY_EFFECT,
      cards: opponent.hand,
      filter: { superType: SuperType.TRAINER, trainerType: TrainerType.SUPPORTER },
      options: jasmine.objectContaining({ allowCancel: true, min: 1, max: 1 })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [supporter]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards.length).toEqual(2);
    // the Supporter stays in the opponent's hand (plus the card drawn at the start of the turn)
    expect(opponent.hand.cards).toContain(supporter);
    expect(opponent.hand.cards.length).toEqual(3);
    expect(opponent.deck.cards.length).toEqual(opponentDeckSize - 1);
    expect(opponent.discard.cards).toEqual([]);
  });

  it('Should use Supernatural and cancel', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    opponent.hand.cards = [new TestDrawSupporter()];

    sim.dispatch(new AttackAction(1, 'Supernatural'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards.length).toEqual(0);
  });

  // Dark Bind (20) - You may discard a D Energy card attached to Sableye. If you do, the Defending Pokémon is now
  // Paralyzed.
  it('Should use Dark Bind and discard a Darkness Energy', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const dark = player.active.energies.cards[0];

    sim.dispatch(new AttackAction(1, 'Dark Bind'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose energy',
      playerId: player.id,
      message: GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
      cost: [CardType.DARK],
      options: jasmine.objectContaining({ allowCancel: true })
    }));
    const prompt = prompts[0] as ChooseEnergyPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [prompt.energy[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
    expect(player.discard.cards).toEqual([dark]);
  });

  it('Should use Dark Bind without discarding', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Dark Bind'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([]);
    expect(player.active.energies.cards.length).toEqual(2);
  });
});
