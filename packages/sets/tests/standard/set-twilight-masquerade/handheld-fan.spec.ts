import { AttackAction, ChooseCardsPrompt, ChoosePokemonPrompt, ResolvePromptAction } from '@ptcg/common';

import { HandheldFan } from '../../../src/standard/set-twilight-masquerade/handheld-fan';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Handheld Fan TWM', () => {
  it('moves an Energy from the Attacking Pokémon to one of the attacker\'s Benched Pokémon', () => {
    const sim = TestUtils.createTestSimulator();
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.energies.cards = TestUtils.makeEnergies([0]);
    player.bench[0].pokemons.cards = [new TestPokemon()];
    opponent.active.trainers.cards = [new HandheldFan()];
    const energy = player.active.energies.cards[0];
    sim.dispatch(new AttackAction(1, 'Test attack'));
    const choose = TestUtils.lastPrompt(sim, opponent) as ChooseCardsPrompt;
    expect(choose instanceof ChooseCardsPrompt).toBeTrue();
    sim.dispatch(new ResolvePromptAction(choose.id, [energy]));
    const target = TestUtils.lastPrompt(sim, opponent) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(target.id, [player.bench[0]]));
    expect(player.bench[0].energies.cards).toEqual([energy]);
    expect(player.active.energies.cards).toEqual([]);
  });
});
