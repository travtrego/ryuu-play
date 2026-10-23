import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
  UseAbilityAction,
} from '@ptcg/common';

import { DarkDragonair } from '../../../src/base-sets/set-team-rocket/dark-dragonair';
import { DarkDragonite } from '../../../src/base-sets/set-team-rocket/dark-dragonite';
import { Dratini } from '../../../src/base-sets/set-team-rocket/dratini';
import { Charmeleon } from '../../../src/base-sets/set-base/charmeleon';
import { Sleep } from '../../../src/base-sets/set-team-rocket/sleep';
import { TestUtils } from '../../test-utils';

describe('Dark Dragonair TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Dratini(), new DarkDragonair()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  function useEvolutionaryLight(): string {
    const { player } = TestUtils.getAll(sim);
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Evolutionary Light', TestUtils.target(sim, player.active)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Evolutionary Light - Once during your turn (before your attack), you may search your deck for an Evolution
  // card. Show it to your opponent and put it into your hand. Shuffle your deck afterward. This power can't be used
  // if Dark Dragonair is Asleep, Confused, or Paralyzed.
  it('Should use Evolutionary Light to put an Evolution card into the hand', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const dragonite = new DarkDragonite();
    const charmeleon = new Charmeleon();
    const dratini = new Dratini();
    const sleep = new Sleep();
    player.deck.cards = [dratini, sleep, charmeleon, dragonite];

    expect(useEvolutionaryLight()).toEqual('');

    const prompt = prompts[0] as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({ type: 'Choose cards', playerId: player.id }));
    expect(prompt.validate([charmeleon])).toBeTrue();
    expect(prompt.validate([dragonite])).toBeTrue();
    expect(prompt.validate([dratini])).toBeFalse();
    expect(prompt.validate([sleep])).toBeFalse();
    expect(prompt.validate([charmeleon, dragonite])).toBeFalse();
    sim.dispatch(new ResolvePromptAction(prompt.id, [dragonite]));

    const show = TestUtils.lastPrompt(sim, opponent)!;
    expect(show).toEqual(jasmine.objectContaining({ type: 'Show cards', playerId: opponent.id }));
    sim.dispatch(new ResolvePromptAction(show.id, true));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([dragonite]);
    expect(player.deck.cards.length).toEqual(3);
    expect(prompts.some(p => p.type === 'Shuffle deck' && p.playerId === player.id)).toBeTrue();
  });

  it('Should use Evolutionary Light from the Bench', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new Dratini(), new DarkDragonair()]);
    TestUtils.setActive(sim, [new Dratini()]);
    const charmeleon = new Charmeleon();
    player.deck.cards = [charmeleon];

    sim.dispatch(new UseAbilityAction(1, 'Evolutionary Light', TestUtils.target(sim, player.bench[0])));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [charmeleon]));
    const show = TestUtils.lastPrompt(sim)!;
    sim.dispatch(new ResolvePromptAction(show.id, true));

    expect(player.hand.cards).toEqual([charmeleon]);
  });

  it('Should use Evolutionary Light only once per turn', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const charmeleon = new Charmeleon();
    player.deck.cards = [charmeleon, new Charmeleon()];

    expect(useEvolutionaryLight()).toEqual('');
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [charmeleon]));
    sim.dispatch(new ResolvePromptAction(TestUtils.lastPrompt(sim)!.id, true));
    expect(player.hand.cards).toEqual([charmeleon]);

    expect(useEvolutionaryLight()).toEqual(GameMessage.POWER_ALREADY_USED);
  });

  [SpecialCondition.ASLEEP, SpecialCondition.CONFUSED, SpecialCondition.PARALYZED].forEach(condition => {
    it(`Should not use Evolutionary Light when Dark Dragonair is ${SpecialCondition[condition]}`, () => {
      const { player, prompts } = TestUtils.getAll(sim);
      player.active.addSpecialCondition(condition);

      expect(useEvolutionaryLight()).toEqual(GameMessage.CANNOT_USE_POWER);
      expect(prompts.length).toEqual(0);
    });
  });

  // Tail Strike (20+) - Flip a coin. If heads, this attack does 20 damage plus 20 more damage; if tails, this
  // attack does 20 damage.
  it('Should use Tail Strike - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Tail Strike'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Tail Strike - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Tail Strike'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });
});
