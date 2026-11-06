import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { DarkCharizard } from '../../../src/base-sets/set-team-rocket/dark-charizard';
import { TestUtils } from '../../test-utils';

describe('Dark Charizard TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new DarkCharizard()],
      [CardType.FIRE, CardType.FIRE, CardType.FIRE, CardType.WATER]
    );
  });

  // Nail Flick (10)
  it('Should use Nail Flick', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Nail Flick'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  // Continuous Fireball (50×) - Flip a number of coins equal to the number of R Energy cards attached to Dark
  // Charizard. This attack does 50 damage times the number of heads. Discard a number of R Energy cards attached
  // to Dark Charizard equal to the number of heads.
  it('Should use Continuous Fireball - 2 heads of 3', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const [f1, f2, f3, water] = player.active.energies.cards;
    TestUtils.setFlipResults(sim, [true, true, false]);

    sim.dispatch(new AttackAction(1, 'Continuous Fireball'));

    expect(prompts.filter(p => p.type === 'Coin flip').length).toEqual(3);
    const choose = prompts.find(p => p.type === 'Choose cards') as ChooseCardsPrompt;
    expect(choose).toEqual(jasmine.objectContaining({
      playerId: player.id,
      options: jasmine.objectContaining({ min: 2, max: 2 }),
    }));
    expect(choose.validate([f1, water])).toBeFalse();
    sim.dispatch(new ResolvePromptAction(choose.id, [f1, f3]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(100);
    expect(player.active.energies.cards).toEqual([f2, water]);
    expect(player.discard.cards).toEqual([f1, f3]);
  });

  it('Should use Continuous Fireball - 3 heads', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const [f1, f2, f3, water] = player.active.energies.cards;
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Continuous Fireball'));
    const choose = prompts.find(p => p.type === 'Choose cards')!;
    sim.dispatch(new ResolvePromptAction(choose.id, [f1, f2, f3]));

    expect(opponent.active.damage).toEqual(150);
    expect(player.active.energies.cards).toEqual([water]);
  });

  it('Should use Continuous Fireball - all tails does nothing and discards nothing', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Continuous Fireball'));

    expect(prompts.some(p => p.type === 'Choose cards')).toBeFalse();
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(player.active.energies.cards.length).toEqual(4);
  });

  it('Should flip one coin per R Energy card', () => {
    const { prompts } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new DarkCharizard()], [CardType.FIRE, CardType.FIRE]);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Continuous Fireball'));

    expect(prompts.filter(p => p.type === 'Coin flip').length).toEqual(2);
  });
});
