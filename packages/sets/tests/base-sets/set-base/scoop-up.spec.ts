import {
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { ScoopUp } from '../../../src/base-sets/set-base/scoop-up';
import { Charmander } from '../../../src/base-sets/set-base/charmander';
import { Charmeleon } from '../../../src/base-sets/set-base/charmeleon';
import { FireEnergy } from '../../../src/base-sets/set-base/fire-energy';
import { Defender } from '../../../src/base-sets/set-base/defender';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Scoop Up BS', () => {
  let sim: Simulator;
  let trainerCard: ScoopUp;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new ScoopUp();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  it('Should return the Basic Pokémon card to hand and discard all attached cards', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const charmander = new Charmander();
    const charmeleon = new Charmeleon();
    const fire = new FireEnergy();
    const defender = new Defender();
    player.bench[0] = TestUtils.pokemonSlot([charmander, charmeleon], [], [defender], 40);
    player.bench[0].energies.cards = [fire];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      slots: [SlotType.ACTIVE, SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([charmander]);
    expect(player.bench[0].pokemons.cards).toEqual([]);
    expect(player.bench[0].energies.cards).toEqual([]);
    expect(player.bench[0].trainers.cards).toEqual([]);
    expect(player.bench[0].damage).toEqual(0);
    expect(player.discard.cards).toEqual(jasmine.arrayWithExactContents([trainerCard, charmeleon, fire, defender]));
  });

  it('Should scoop up the Active Pokémon and require a new Active Pokémon', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const charmander = new Charmander();
    TestUtils.setActive(sim, [charmander]);
    const benched = TestUtils.pokemonSlot([new TestPokemon()]);
    player.bench[0] = benched;

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.active]));

    expect(prompts[1]).toEqual(jasmine.objectContaining({
      playerId: player.id,
      message: GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,
    }));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [benched]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active).toBe(benched);
    expect(player.hand.cards).toEqual([charmander]);
    expect(player.discard.cards).toEqual([trainerCard]);
  });
});
