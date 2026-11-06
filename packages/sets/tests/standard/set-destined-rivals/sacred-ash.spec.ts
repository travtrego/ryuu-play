import { ChooseCardsPrompt, PlayCardAction, ResolvePromptAction } from '@ptcg/common';

import { SacredAsh } from '../../../src/standard/set-destined-rivals/sacred-ash';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Sacred Ash DRI', () => {
  it('shuffles 5 Pokémon from the discard pile into the deck', () => {
    const sim = TestUtils.createTestSimulator();
    const { player } = TestUtils.getAll(sim);
    const pokemon = Array.from({ length: 6 }, () => new TestPokemon());
    player.discard.cards = [...pokemon];
    player.hand.cards = [new SacredAsh()];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect([prompt.options.min, prompt.options.max]).toEqual([5, 5]);
    sim.dispatch(new ResolvePromptAction(prompt.id, pokemon.slice(0, 5)));
    expect(player.deck.cards.length).toEqual(55);
    expect(player.discard.cards.filter(c => c instanceof TestPokemon).length).toEqual(1);
  });
});
