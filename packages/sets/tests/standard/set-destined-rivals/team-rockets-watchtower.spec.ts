import { CardType, Simulator, UseAbilityAction } from '@ptcg/common';

import { TeamRocketsWatchtower } from '../../../src/standard/set-destined-rivals/team-rockets-watchtower';
import { Dudunsparce } from '../../../src/standard/set-temporal-forces/dudunsparce';
import { Dunsparce } from '../../../src/standard/set-temporal-forces/dunsparce';
import { Drakloak } from '../../../src/standard/set-twilight-masquerade/drakloak';
import { Dreepy } from '../../../src/standard/set-twilight-masquerade/dreepy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Team Rocket\'s Watchtower DRI', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    const { opponent } = TestUtils.getAll(sim);
    opponent.stadium.cards = [new TeamRocketsWatchtower()];
  });

  it('C Pokémon in play have no Abilities', () => {
    const { player } = TestUtils.getAll(sim);
    expect(new Dudunsparce().cardTypes).toEqual([CardType.COLORLESS]);
    player.bench[0].pokemons.cards = [new Dunsparce(), new Dudunsparce()];
    player.bench[1].pokemons.cards = [new TestPokemon()];
    expect(() => sim.dispatch(new UseAbilityAction(1, 'Run Away Draw', TestUtils.target(sim, player.bench[0]))))
      .toThrow();
  });

  it('other Pokémon keep their Abilities', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0].pokemons.cards = [new Dreepy(), new Drakloak()];
    sim.dispatch(new UseAbilityAction(1, 'Recon Directive', TestUtils.target(sim, player.bench[0])));
    expect(sim.store.state.prompts.some(p => p.result === undefined)).toBeTrue();
  });
});
