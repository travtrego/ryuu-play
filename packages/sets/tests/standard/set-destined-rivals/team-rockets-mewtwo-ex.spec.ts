import {
  AttackAction,
  CardTag,
  CardType,
  ChooseCardsPrompt,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { TeamRocketsMewtwoEx } from '../../../src/standard/set-destined-rivals/team-rockets-mewtwo-ex';
import { TeamRocketsTarountula } from '../../../src/standard/set-destined-rivals/team-rockets-tarountula';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Team Rocket\'s Mewtwo ex DRI', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    TestUtils.setActive(sim, [new TeamRocketsMewtwoEx()],
      [CardType.PSYCHIC, CardType.PSYCHIC, CardType.COLORLESS]);
  });

  function benchTeamRocket(count: number, energies: CardType[] = []) {
    const { player } = TestUtils.getAll(sim);
    for (let i = 0; i < count; i++) {
      const slot = TestUtils.pokemonSlot([new TeamRocketsTarountula()], i === 0 ? energies : []);
      player.bench[i].pokemons.cards = slot.pokemons.cards;
      player.bench[i].energies.cards = slot.energies.cards;
    }
  }

  it('Should have the printed stats and the Pokémon ex rule', () => {
    const card = new TeamRocketsMewtwoEx();
    expect(card.hp).toEqual(280);
    expect(card.tags).toContain(CardTag.POKEMON_EX);
    expect(card.weakness).toEqual([{ type: CardType.DARK }]);
    expect(card.resistance).toEqual([{ type: CardType.FIGHTING, value: -30 }]);
    expect(card.retreat.length).toEqual(3);
  });

  it('Power Saver: can\'t attack with fewer than 4 Team Rocket\'s Pokémon in play', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    benchTeamRocket(2);
    player.bench[2].pokemons.cards = [new TestPokemon()];
    expect(() => sim.dispatch(new AttackAction(1, 'Erasure Ball'))).toThrow();
    expect(opponent.active.damage).toEqual(0);
  });

  it('Erasure Ball does 160 damage when nothing is discarded', () => {
    const { opponent } = TestUtils.getAll(sim);
    benchTeamRocket(3);
    sim.dispatch(new AttackAction(1, 'Erasure Ball'));
    expect(opponent.active.damage).toEqual(160);
  });

  it('Erasure Ball does 60 more for each Benched Energy discarded (up to 2)', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    benchTeamRocket(3, [CardType.GRASS, CardType.GRASS, CardType.GRASS]);
    sim.dispatch(new AttackAction(1, 'Erasure Ball'));

    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt instanceof ChooseCardsPrompt).toBeTrue();
    expect(prompt.options.max).toEqual(2);
    const chosen = player.bench[0].energies.cards.slice(0, 2);
    sim.dispatch(new ResolvePromptAction(prompt.id, chosen));

    expect(opponent.active.damage).toEqual(280);
    expect(player.bench[0].energies.cards.length).toEqual(1);
    expect(player.discard.cards).toEqual(jasmine.arrayContaining(chosen));
  });
});
