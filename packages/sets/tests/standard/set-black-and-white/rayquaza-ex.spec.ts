import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  SelectPrompt,
  Simulator,
} from '@ptcg/common';

import { FireEnergy } from '../../../src/base-sets/set-base/fire-energy';
import { LightningEnergy } from '../../../src/base-sets/set-base/lightning-energy';
import { RainbowEnergy } from '../../../src/standard/set-black-and-white/rainbow-energy';
import { RayquazaEx } from '../../../src/standard/set-black-and-white/rayquaza-ex';
import { TestUtils } from '../../test-utils';

describe('Rayquaza EX DRX', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new RayquazaEx()], [CardType.FIRE, CardType.LIGHTNING]);
  });

  // Celestial Roar - Discard the top 3 cards of your deck. If any of those cards are Energy cards,
  // attach them to this Pokemon.
  it('Should use Celestial Roar and attach the Energy among the top 3 cards', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const fire = new FireEnergy();
    const lightning = new LightningEnergy();
    const other = TestUtils.makeTestCards(1)[0];
    player.deck.cards = [fire, other, lightning, ...TestUtils.makeTestCards(5)];
    const energiesBefore = player.active.energies.cards.length;

    sim.dispatch(new AttackAction(1, 'Celestial Roar'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.energies.cards.length).toEqual(energiesBefore + 2);
    expect(player.active.energies.cards).toContain(fire);
    expect(player.active.energies.cards).toContain(lightning);
    expect(player.discard.cards).toEqual([other]);
  });

  it('Should use Celestial Roar and discard all 3 when none are Energy', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.deck.cards = TestUtils.makeTestCards(6);
    const top3 = player.deck.cards.slice(0, 3);
    const energiesBefore = player.active.energies.cards.length;

    sim.dispatch(new AttackAction(1, 'Celestial Roar'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.energies.cards.length).toEqual(energiesBefore);
    expect(player.discard.cards).toEqual(top3);
  });

  // Dragon Burst (60x) - Discard all basic R Energy or all basic L Energy attached to this Pokemon.
  // This attack does 60 damage times the number of Energy cards you discarded.
  it('Should use Dragon Burst discarding Fire Energy', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const fire1 = new FireEnergy();
    const fire2 = new FireEnergy();
    const lightning = new LightningEnergy();
    player.active.energies.cards = [fire1, fire2, lightning];

    sim.dispatch(new AttackAction(1, 'Dragon Burst'));

    const prompt = prompts[0] as SelectPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Select',
      playerId: player.id,
      message: GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
      values: [GameMessage.TYPE_FIRE, GameMessage.TYPE_LIGHTNING],
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, 0));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(120);
    expect(player.active.energies.cards).toEqual([lightning]);
    expect(player.discard.cards.length).toEqual(2);
  });

  it('Should use Dragon Burst discarding Lightning Energy', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const fire = new FireEnergy();
    const lightning = new LightningEnergy();
    player.active.energies.cards = [fire, lightning];

    sim.dispatch(new AttackAction(1, 'Dragon Burst'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, 1));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
    expect(player.active.energies.cards).toEqual([fire]);
  });

  // Only *basic* Energy is discarded, so a Rainbow Energy paying the R cost counts for nothing
  it('Should use Dragon Burst for 0 damage when no basic Energy of that type is attached', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const rainbow = new RainbowEnergy();
    const lightning = new LightningEnergy();
    player.active.energies.cards = [rainbow, lightning];

    sim.dispatch(new AttackAction(1, 'Dragon Burst'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, 0));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(player.active.energies.cards).toEqual([rainbow, lightning]);
  });
});
