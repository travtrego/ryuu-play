import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { DarkGolduck } from '../../../src/base-sets/set-team-rocket/dark-golduck';
import { TestUtils } from '../../test-utils';

describe('Dark Golduck TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new DarkGolduck()],
      [CardType.PSYCHIC, CardType.PSYCHIC, CardType.WATER]
    );
  });

  // Third Eye - Discard 1 Energy card attached to Dark Golduck in order to draw up to 3 cards.
  it('Should use Third Eye to discard an Energy card and draw 3 cards', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const [p1, p2, water] = player.active.energies.cards;
    const top = player.deck.cards.slice(0, 3);

    sim.dispatch(new AttackAction(1, 'Third Eye'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      options: jasmine.objectContaining({ min: 1, max: 1 }),
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [water]));

    const draw = prompts[1] as ChooseCardsPrompt;
    expect(draw.options.max).toEqual(3);
    sim.dispatch(new ResolvePromptAction(draw.id, draw.cards.cards.slice()));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(player.active.energies.cards).toEqual([p1, p2]);
    expect(player.discard.cards).toEqual([water]);
    expect(player.hand.cards).toEqual(top);
    expect(player.deck.cards.length).toEqual(47);
  });

  it('Should use Third Eye and draw fewer than 3 cards', () => {
    const { player, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Third Eye'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.active.energies.cards[0]]));
    const draw = prompts[1] as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(draw.id, draw.cards.cards.slice(0, 1)));

    expect(player.hand.cards.length).toEqual(1);
    expect(player.deck.cards.length).toEqual(49);
    expect(player.active.energies.cards.length).toEqual(2);
  });

  it('Should use Third Eye with fewer than 3 cards in the deck', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.deck.cards = TestUtils.makeTestCards(2);

    sim.dispatch(new AttackAction(1, 'Third Eye'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.active.energies.cards[0]]));
    const draw = prompts[1] as ChooseCardsPrompt;
    expect(draw.options.max).toEqual(2);
    sim.dispatch(new ResolvePromptAction(draw.id, draw.cards.cards.slice()));

    expect(player.hand.cards.length).toEqual(2);
    expect(player.deck.cards.length).toEqual(0);
  });

  // Super Psy (50)
  it('Should use Super Psy', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Super Psy'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
  });
});
