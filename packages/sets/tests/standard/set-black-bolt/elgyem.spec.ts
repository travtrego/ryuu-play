import { AttackAction, CardType, MoveEnergyPrompt, PlayerType, ResolvePromptAction, SlotType } from '@ptcg/common';

import { Elgyem } from '../../../src/standard/set-black-bolt/elgyem';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Elgyem BLK', () => {
  it('Slight Shift moves an Energy between the opponent\'s Pokémon', () => {
    const sim = TestUtils.createTestSimulator();
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Elgyem()], [CardType.PSYCHIC]);
    opponent.active.energies.cards = TestUtils.makeEnergies([CardType.FIRE]);
    opponent.bench[0].pokemons.cards = [new TestPokemon()];
    const energy = opponent.active.energies.cards[0];
    sim.dispatch(new AttackAction(1, 'Slight Shift'));
    const prompt = TestUtils.lastPrompt(sim, player) as MoveEnergyPrompt;
    expect(prompt instanceof MoveEnergyPrompt).toBeTrue();
    sim.dispatch(new ResolvePromptAction(prompt.id, [{
      from: { player: PlayerType.TOP_PLAYER, slot: SlotType.ACTIVE, index: 0 },
      to: { player: PlayerType.TOP_PLAYER, slot: SlotType.BENCH, index: 0 },
      card: energy
    }]));
    expect(opponent.bench[0].energies.cards).toEqual([energy]);
    expect(new Elgyem().hp).toEqual(60);
  });
});
