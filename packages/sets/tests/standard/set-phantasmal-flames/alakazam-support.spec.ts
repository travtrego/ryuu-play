import {
  AttachEnergyPrompt,
  AttackAction,
  CardType,
  PlayCardAction,
  PlayerType,
  PutDamagePrompt,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { BattleCage } from '../../../src/standard/set-phantasmal-flames/battle-cage';
import { WondrousPatch } from '../../../src/standard/set-phantasmal-flames/wondrous-patch';
import { DragapultEx } from '../../../src/standard/set-twilight-masquerade/dragapult-ex';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class PsychicPokemon extends TestPokemon {
  public cardTypes = [CardType.PSYCHIC];
}

describe('Phantasmal Flames cards for Alakazam', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  it('Wondrous Patch attaches a Basic P Energy from the discard pile to a Benched P Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0].pokemons.cards = [new PsychicPokemon()];
    const psychic = TestUtils.makeEnergies([CardType.PSYCHIC])[0];
    player.discard.cards = [psychic];
    player.hand.cards = [new WondrousPatch()];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    const prompt = TestUtils.lastPrompt(sim, player) as AttachEnergyPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [
      { to: { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 }, card: psychic }
    ]));
    expect(player.bench[0].energies.cards).toEqual([psychic]);
  });

  it('Wondrous Patch needs a Benched P Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0].pokemons.cards = [new TestPokemon()];
    player.discard.cards = TestUtils.makeEnergies([CardType.PSYCHIC]);
    player.hand.cards = [new WondrousPatch()];
    expect(() => sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)))).toThrow();
  });

  it('Battle Cage stops attack damage counters on the opponent\'s Bench, not the damage to the Active', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.stadium.cards = [new BattleCage()];
    TestUtils.setActive(sim, [new DragapultEx()], [CardType.FIRE, CardType.PSYCHIC]);
    opponent.bench[0].pokemons.cards = [new TestPokemon()];
    sim.dispatch(new AttackAction(1, 'Phantom Dive'));
    const prompt = TestUtils.lastPrompt(sim, player) as PutDamagePrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [
      { target: { player: PlayerType.TOP_PLAYER, slot: SlotType.BENCH, index: 0 }, damage: 60 }
    ]));
    expect(opponent.active.damage).toEqual(200);
    expect(opponent.bench[0].damage).toEqual(0);
  });
});
