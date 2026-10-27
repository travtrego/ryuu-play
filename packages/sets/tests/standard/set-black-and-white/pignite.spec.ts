import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  GameMessage,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { FireEnergy } from '../../../src/base-sets/set-base/fire-energy';
import { Pignite } from '../../../src/standard/set-black-and-white/pignite';
import { TestUtils } from '../../test-utils';

describe('Pignite BW', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Pignite()],
      [CardType.FIRE, CardType.FIRE, CardType.COLORLESS]
    );
  });

  // Flame Charge - Search your deck for a R Energy card and attach it to this Pokemon.
  // Shuffle your deck afterward.
  it('Should use Flame Charge and attach a Fire Energy from the deck', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const fire = new FireEnergy();
    player.deck.cards = [fire, ...TestUtils.makeTestCards(3)];
    const energiesBefore = player.active.energies.cards.length;

    sim.dispatch(new AttackAction(1, 'Flame Charge'));

    const prompt = prompts[0] as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_ATTACH,
      cards: player.deck,
      options: jasmine.objectContaining({ min: 1, max: 1, allowCancel: true }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [fire]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.energies.cards.length).toEqual(energiesBefore + 1);
    expect(player.active.energies.cards).toContain(fire);
    expect(player.deck.cards).not.toContain(fire);
    expect(prompts.some(p => p.type === 'Shuffle deck')).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Flame Charge and attach nothing when the prompt is canceled', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const fire = new FireEnergy();
    player.deck.cards = [fire, ...TestUtils.makeTestCards(3)];
    const energiesBefore = player.active.energies.cards.length;

    sim.dispatch(new AttackAction(1, 'Flame Charge'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.energies.cards.length).toEqual(energiesBefore);
    expect(player.deck.cards).toContain(fire);
  });

  it('Should use Flame Charge with an empty deck and do nothing', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    player.deck.cards = [];

    sim.dispatch(new AttackAction(1, 'Flame Charge'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
  });

  // Heat Crash (50)
  it('Should use Heat Crash for 50 damage', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Heat Crash'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
  });
});
