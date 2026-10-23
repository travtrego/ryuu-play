import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  GameMessage,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Cubone } from '../../../src/base-sets/set-jungle/cubone';
import { Marowak } from '../../../src/base-sets/set-jungle/marowak';
import { Pikachu } from '../../../src/base-sets/set-jungle/pikachu';
import { TestUtils } from '../../test-utils';

describe('Marowak JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Marowak()],
      [CardType.FIGHTING, CardType.FIGHTING, CardType.COLORLESS],
    );
  });

  // Bonemerang (30x) - Flip 2 coins. This attack does 30 damage times the number of heads.
  it('Should use Bonemerang - 2 heads', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Bonemerang'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Bonemerang - 1 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, true]);

    sim.dispatch(new AttackAction(1, 'Bonemerang'));

    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Bonemerang - 2 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Bonemerang'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  // Call for Friend - Search your deck for a F Basic Pokémon card and put it onto your Bench. Shuffle your deck
  // afterward. (You can't use this attack if your Bench is full.)
  it('Should use Call for Friend and put a Fighting Basic Pokémon onto the Bench', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    const cubone = new Cubone();
    player.deck.cards.push(cubone);

    sim.dispatch(new AttackAction(1, 'Call for Friend'));

    const prompt = prompts[0] as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_PUT_ONTO_BENCH,
      cards: player.deck,
      options: jasmine.objectContaining({ max: 1 }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [cubone]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(prompts.some(p => p.type === 'Shuffle deck')).toBeTrue();
    expect(player.bench[0].pokemons.cards).toEqual([cubone]);
    expect(player.deck.cards).not.toContain(cubone);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should not allow Call for Friend to choose a non-Fighting Basic Pokémon', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const pikachu = new Pikachu();
    const marowak = new Marowak();
    player.deck.cards.push(pikachu, marowak);

    sim.dispatch(new AttackAction(1, 'Call for Friend'));

    const prompt = prompts[0] as ChooseCardsPrompt;
    expect(prompt.validate([pikachu])).toBeFalse();
    expect(prompt.validate([marowak])).toBeFalse();
  });
});
