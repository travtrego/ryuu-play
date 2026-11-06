import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Gloom } from '../../../src/base-sets/set-jungle/gloom';
import { Oddish } from '../../../src/base-sets/set-jungle/oddish';
import { Paras } from '../../../src/base-sets/set-jungle/paras';
import { TestUtils } from '../../test-utils';

describe('Oddish JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Oddish()],
      [CardType.GRASS, CardType.GRASS],
    );
  });

  // Stun Spore (10) - Flip a coin. If heads, the Defending Pokémon is now Paralyzed.
  it('Should use Stun Spore - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Stun Spore'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Stun Spore - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Stun Spore'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Sprout - Search your deck for a Basic Pokémon named Oddish and put it onto your Bench. Shuffle your deck
  // afterward. (You can't use this attack if your Bench is full.)
  it('Should use Sprout and bench an Oddish', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    const oddish = new Oddish();
    player.deck.cards.push(oddish);

    sim.dispatch(new AttackAction(1, 'Sprout'));

    const prompt = prompts[0] as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_PUT_ONTO_BENCH,
      cards: player.deck,
      options: jasmine.objectContaining({ max: 1 }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [oddish]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.bench[0].pokemons.cards).toEqual([oddish]);
    expect(player.deck.cards).not.toContain(oddish);
    expect(prompts.some(p => p.type === 'Shuffle deck')).toBeTrue();
  });

  it('Should not allow Sprout to choose other Pokémon', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const paras = new Paras();
    const gloom = new Gloom();
    player.deck.cards.push(paras, gloom);

    sim.dispatch(new AttackAction(1, 'Sprout'));

    const prompt = prompts[0] as ChooseCardsPrompt;
    expect(prompt.validate([paras])).toBeFalse();
    expect(prompt.validate([gloom])).toBeFalse();
  });

  it('Should use Sprout and cancel', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Sprout'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.bench[0].pokemons.cards).toEqual([]);
    expect(player.deck.cards.length).toEqual(50);
  });
});
