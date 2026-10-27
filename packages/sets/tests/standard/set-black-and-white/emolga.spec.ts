import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Emolga } from '../../../src/standard/set-black-and-white/emolga';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Emolga DRX', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Emolga()], [CardType.LIGHTNING]);
  });

  // Call for Family - Search your deck for 2 Basic Pokemon and put them onto your Bench.
  // Shuffle your deck afterward.
  it('Should use Call for Family and bench 2 Basic Pokemon', () => {
    const { player, deck, opponent, prompts } = TestUtils.getAll(sim);
    const basic1 = new TestPokemon();
    const basic2 = new TestPokemon();
    deck.cards.push(basic1, basic2);

    sim.dispatch(new AttackAction(1, 'Call for Family'));

    const prompt = prompts[0] as ChooseCardsPrompt;
    expect(prompt.type).toEqual('Choose cards');
    sim.dispatch(new ResolvePromptAction(prompt.id, [basic1, basic2]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.bench[0].pokemons.cards).toEqual([basic1]);
    expect(player.bench[1].pokemons.cards).toEqual([basic2]);
    expect(deck.cards).not.toContain(basic1);
    expect(deck.cards).not.toContain(basic2);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Call for Family and bench nothing when the prompt is canceled', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Call for Family'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.bench.every(b => b.pokemons.cards.length === 0)).toBeTrue();
  });

  // Static Shock (20)
  it('Should use Static Shock for 20 damage', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Static Shock'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });
});
