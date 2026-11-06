import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  Stage,
} from '@ptcg/common';

import { Anorith } from '../../../src/ex-sets/set-sandstorm/anorith';
import { TestCard } from '../../test-cards/test-card';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Anorith SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Anorith()],
      [CardType.FIGHTING, CardType.COLORLESS]
    );
  });

  // Fast Evolution - Search your deck for an Evolution card, show it to your opponent, and put it into your hand.
  // Shuffle your deck afterward.
  it('Should use Fast Evolution and put an Evolution card into hand', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const basic = new TestPokemon();
    const stage1 = new TestPokemon();
    stage1.stage = Stage.STAGE_1;
    const card = new TestCard();
    player.deck.cards = [basic, stage1, card];

    sim.dispatch(new AttackAction(1, 'Fast Evolution'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      cards: player.deck,
      options: jasmine.objectContaining({ max: 1, allowCancel: true })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [stage1]));

    expect(prompts[1]).toEqual(jasmine.objectContaining({
      type: 'Show cards',
      playerId: opponent.id,
      cards: [stage1]
    }));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, true));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([stage1]);
    expect(player.deck.cards).toEqual([card, basic]);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Fast Evolution and cancel', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const stage1 = new TestPokemon();
    stage1.stage = Stage.STAGE_1;
    player.deck.cards = [stage1];

    sim.dispatch(new AttackAction(1, 'Fast Evolution'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([]);
    expect(player.deck.cards).toEqual([stage1]);
  });

  it('Should use Fast Evolution with an empty deck', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.deck.cards = [];

    sim.dispatch(new AttackAction(1, 'Fast Evolution'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([]);
  });

  // Pierce (30)
  it('Should use Pierce', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Pierce'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });
});
