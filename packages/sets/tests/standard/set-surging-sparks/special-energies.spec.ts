import {
  CardType,
  ChooseCardsPrompt,
  PlayCardAction,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
  Stage,
} from '@ptcg/common';

import { EnrichingEnergy } from '../../../src/standard/set-surging-sparks/enriching-energy';
import { TelepathicPsychicEnergy } from '../../../src/standard/set-perfect-order/telepathic-psychic-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class PsychicBasic extends TestPokemon {
  public cardTypes = [CardType.PSYCHIC];
  public stage = Stage.BASIC;
}

const active = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };

describe('Enriching Energy SSP / Telepathic Psychic Energy POR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 3; // one Energy from the hand per turn: not used yet this turn
  });

  it('Enriching Energy: attaching it from the hand draws 4', () => {
    const { player } = TestUtils.getAll(sim);
    const energy = new EnrichingEnergy();
    player.hand.cards = [energy];
    sim.dispatch(new PlayCardAction(1, 0, active));
    expect(player.active.energies.cards).toEqual([energy]);
    expect(player.hand.cards.length).toEqual(4);
  });

  it('Telepathic Psychic Energy: attached to a P Pokémon, bench up to 2 Basic P Pokémon from the deck', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.pokemons.cards = [new PsychicBasic()];
    const a = new PsychicBasic();
    const b = new PsychicBasic();
    const other = new TestPokemon();
    player.deck.cards = [other, a, b, ...TestUtils.makeTestCards(3)];
    const energy = new TelepathicPsychicEnergy();
    player.hand.cards = [energy];
    sim.dispatch(new PlayCardAction(1, 0, active));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt.validate([other])).toBeFalse();
    sim.dispatch(new ResolvePromptAction(prompt.id, [a, b]));
    expect(player.bench[0].getPokemonCard()).toBe(a);
    expect(player.bench[1].getPokemonCard()).toBe(b);
    expect(player.active.energies.cards).toEqual([energy]);
  });

  it('Telepathic Psychic Energy on a non-P Pokémon does not search', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [new TelepathicPsychicEnergy()];
    sim.dispatch(new PlayCardAction(1, 0, active));
    expect(TestUtils.lastPrompt(sim, player) instanceof ChooseCardsPrompt).toBeFalse();
  });
});
