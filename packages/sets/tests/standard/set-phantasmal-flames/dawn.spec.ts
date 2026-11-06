import { ChooseCardsPrompt, PlayCardAction, ResolvePromptAction, Stage } from '@ptcg/common';

import { Dawn } from '../../../src/standard/set-phantasmal-flames/dawn';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class Stage1 extends TestPokemon { public stage = Stage.STAGE_1; }
class Stage2 extends TestPokemon { public stage = Stage.STAGE_2; }

describe('Dawn PFL', () => {
  it('finds a Basic, a Stage 1 and a Stage 2 Pokémon', () => {
    const sim = TestUtils.createTestSimulator();
    const { player, opponent } = TestUtils.getAll(sim);
    const basic = new TestPokemon();
    const s1 = new Stage1();
    const s2 = new Stage2();
    player.hand.cards = [new Dawn()];
    player.deck.cards = [s2, s1, basic, ...TestUtils.makeTestCards(3)];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    for (const [card, stage] of [[basic, Stage.BASIC], [s1, Stage.STAGE_1], [s2, Stage.STAGE_2]] as const) {
      const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
      expect((prompt.filter as any).stage).toEqual(stage);
      sim.dispatch(new ResolvePromptAction(prompt.id, [card]));
    }
    const show = TestUtils.lastPrompt(sim, opponent)!;
    sim.dispatch(new ResolvePromptAction(show.id, true));
    expect(player.hand.cards).toEqual([basic, s1, s2]);
  });
});
