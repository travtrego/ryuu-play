import {
  CardType,
  ChooseCardsPrompt,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { RocketsSneakAttack } from '../../../src/base-sets/set-team-rocket/rockets-sneak-attack';
import { Sleep } from '../../../src/base-sets/set-team-rocket/sleep';
import { Digger } from '../../../src/base-sets/set-team-rocket/digger';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Rocket\'s Sneak Attack TR', () => {
  let sim: Simulator;
  let trainerCard: RocketsSneakAttack;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new RocketsSneakAttack();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  // Look at your opponent's hand. If he or she has any Trainer cards, choose 1 of them. Your opponent shuffles
  // that card into his or her deck.
  it('Should make the opponent shuffle the chosen Trainer card into the deck', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const sleep = new Sleep();
    const digger = new Digger();
    const pokemon = new TestPokemon();
    const [energy] = TestUtils.makeEnergies([CardType.FIRE]);
    opponent.hand.cards = [pokemon, sleep, energy, digger];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    const prompt = prompts[0] as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      options: jasmine.objectContaining({ min: 1, max: 1 }),
    }));
    // The player looks at the whole hand
    expect(prompt.cards.cards).toEqual([pokemon, sleep, energy, digger]);
    expect(prompt.validate([pokemon])).toBeFalse();
    expect(prompt.validate([energy])).toBeFalse();
    expect(prompt.validate([sleep])).toBeTrue();

    sim.dispatch(new ResolvePromptAction(prompt.id, [digger]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.hand.cards).toEqual([pokemon, sleep, energy]);
    expect(opponent.deck.cards.length).toEqual(51);
    expect(opponent.deck.cards).toContain(digger);
    expect(prompts.some(p => p.type === 'Shuffle deck' && p.playerId === opponent.id)).toBeTrue();
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should do nothing to a hand without Trainer cards', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const pokemon = new TestPokemon();
    opponent.hand.cards = [pokemon];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    const prompt = prompts[0] as ChooseCardsPrompt;
    expect(prompt.validate([])).toBeTrue();
    sim.dispatch(new ResolvePromptAction(prompt.id, []));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.hand.cards).toEqual([pokemon]);
    expect(opponent.deck.cards.length).toEqual(50);
    expect(player.discard.cards).toEqual([trainerCard]);
  });
});
