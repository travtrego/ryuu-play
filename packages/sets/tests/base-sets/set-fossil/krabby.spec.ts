import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  ResolvePromptAction,
  Simulator,
  State,
} from '@ptcg/common';

import { Krabby } from '../../../src/base-sets/set-fossil/krabby';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Krabby FO', () => {
  let sim: Simulator;
  let state: State;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    state = sim.store.state;

    TestUtils.setActive(
      sim,
      [new Krabby()],
      [CardType.WATER, CardType.COLORLESS]
    );
  });

  // Call for Family - Search your deck for a Basic Pokémon named Krabby and put it onto your Bench. Shuffle your
  // deck afterward. (You can't use this attack if your Bench is full.)
  it('Should use Call for Family', () => {
    const { player, deck, prompts } = TestUtils.getAll(sim);
    const krabby = new Krabby();
    deck.cards.push(krabby);

    sim.dispatch(new AttackAction(1, 'Call for Family'));
    const prompt = prompts[0] as ChooseCardsPrompt;
    expect(prompt.type).toEqual('Choose cards');
    expect(prompt.filter).toEqual([jasmine.objectContaining({ name: 'Krabby' })]);

    sim.dispatch(new ResolvePromptAction(prompt.id, [krabby]));

    expect(TestUtils.isPlayerTurn(sim, state.players[1])).toBeTrue();
    expect(player.bench[0].pokemons.cards).toEqual([krabby]);
    expect(deck.cards).not.toContain(krabby);
  });

  it('Should use Call for Family - cancel prompt', () => {
    const { player, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Call for Family'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, state.players[1])).toBeTrue();
    expect(player.bench.every(b => b.pokemons.cards.length === 0)).toBeTrue();
  });

  it('Should use Call for Family - full bench', () => {
    const { bench, prompts } = TestUtils.getAll(sim);
    bench.forEach(b => b.pokemons.cards = [new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Call for Family'));
    const prompt = prompts[0] as ChooseCardsPrompt;
    if (prompt !== undefined) {
      expect(prompt.options.max).toEqual(0);
      sim.dispatch(new ResolvePromptAction(prompt.id, null));
    }

    expect(bench.every(b => !(b.getPokemonCard() instanceof Krabby))).toBeTrue();
  });

  // Irongrip (20)
  it('Should use Irongrip', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Irongrip'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });
});
