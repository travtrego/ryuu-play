import { ChooseCardsPrompt, PlayCardAction, ResolvePromptAction, Stage } from '@ptcg/common';

import { Hilda } from '../../../src/standard/set-white-flare/hilda';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestEnergy } from '../../test-cards/test-energy';
import { TestUtils } from '../../test-utils';

class Stage1 extends TestPokemon { public stage = Stage.STAGE_1; }

describe('Hilda WHT', () => {
  it('finds an Evolution Pokémon and an Energy card', () => {
    const sim = TestUtils.createTestSimulator();
    const { player, opponent } = TestUtils.getAll(sim);
    const basic = new TestPokemon();
    const evo = new Stage1();
    const energy = new TestEnergy();
    player.hand.cards = [new Hilda()];
    player.deck.cards = [basic, evo, energy, ...TestUtils.makeTestCards(3)];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    let prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt.validate([basic])).toBeFalse();
    sim.dispatch(new ResolvePromptAction(prompt.id, [evo]));
    prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [energy]));
    const show = TestUtils.lastPrompt(sim, opponent)!;
    sim.dispatch(new ResolvePromptAction(show.id, true));
    expect(player.hand.cards).toEqual([evo, energy]);
  });
});
