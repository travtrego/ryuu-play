import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  GameMessage,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { NidoranMale } from '../../../src/base-sets/set-base/nidoran-male';
import { Nidoran } from '../../../src/base-sets/set-jungle/nidoran';
import { Nidorina } from '../../../src/base-sets/set-jungle/nidorina';
import { Oddish } from '../../../src/base-sets/set-jungle/oddish';
import { TestUtils } from '../../test-utils';

describe('Nidoran Female JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Nidoran()],
      [CardType.GRASS, CardType.GRASS],
    );
  });

  // Fury Swipes (10x) - Flip 3 coins. This attack does 10 damage times the number of heads.
  it('Should use Fury Swipes - 3 heads', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Fury Swipes'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Fury Swipes - 1 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, true, false]);

    sim.dispatch(new AttackAction(1, 'Fury Swipes'));

    expect(opponent.active.damage).toEqual(10);
  });

  it('Should use Fury Swipes - 3 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Fury Swipes'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  // Call for Family - Search your deck for a Basic Pokémon named Nidoran F or Nidoran M and put it onto your Bench.
  // Shuffle your deck afterward. (You can't use this attack if your Bench is full.)
  it('Should use Call for Family and bench a Nidoran Male', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    const nidoranMale = new NidoranMale();
    player.deck.cards.push(nidoranMale);

    sim.dispatch(new AttackAction(1, 'Call for Family'));

    const prompt = prompts[0] as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_PUT_ONTO_BENCH,
      cards: player.deck,
      options: jasmine.objectContaining({ max: 1 }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [nidoranMale]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.bench[0].pokemons.cards).toEqual([nidoranMale]);
    expect(prompts.some(p => p.type === 'Shuffle deck')).toBeTrue();
  });

  it('Should use Call for Family and bench a Nidoran Female', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const nidoranFemale = new Nidoran();
    player.deck.cards.push(nidoranFemale);

    sim.dispatch(new AttackAction(1, 'Call for Family'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [nidoranFemale]));

    expect(player.bench[0].pokemons.cards).toEqual([nidoranFemale]);
  });

  it('Should not allow Call for Family to choose other Pokémon', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const oddish = new Oddish();
    const nidorina = new Nidorina();
    player.deck.cards.push(oddish, nidorina);

    sim.dispatch(new AttackAction(1, 'Call for Family'));

    const prompt = prompts[0] as ChooseCardsPrompt;
    expect(prompt.validate([oddish])).toBeFalse();
    expect(prompt.validate([nidorina])).toBeFalse();
  });
});
