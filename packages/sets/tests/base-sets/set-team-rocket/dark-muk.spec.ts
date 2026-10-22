import {
  AttackAction,
  CardType,
  GameMessage,
  RetreatAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { DarkMuk } from '../../../src/base-sets/set-team-rocket/dark-muk';
import { Grimer } from '../../../src/base-sets/set-team-rocket/grimer';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Dark Muk TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 3;

    TestUtils.setActive(
      sim,
      [new Grimer(), new DarkMuk()],
      [CardType.GRASS, CardType.GRASS]
    );
  });

  // The player retreats against the opponent's Active Dark Muk
  function retreat(): string {
    let message = '';
    try {
      sim.dispatch(new RetreatAction(1, 0));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  function setupOpponentMuk(energies: CardType[] = []) {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TestPokemon()], energies);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    TestUtils.setDefending(sim, [new Grimer(), new DarkMuk()]);
  }

  // Sticky Goo - As long as Dark Muk is your Active Pokémon, your opponent pays C C more to retreat his or her
  // Active Pokémon. This power stops working while Dark Muk is Asleep, Confused, or Paralyzed.
  it('Should make the opponent pay C C more to retreat', () => {
    const { player } = TestUtils.getAll(sim);
    setupOpponentMuk();

    expect(retreat()).toEqual(GameMessage.NOT_ENOUGH_ENERGY);
    expect(TestUtils.getAll(sim).player.active.pokemons.cards[0]).toEqual(jasmine.any(TestPokemon));
    expect(player.bench[0].pokemons.cards.length).toEqual(1);
  });

  it('Should let the opponent retreat by paying C C', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    setupOpponentMuk([CardType.FIRE, CardType.WATER]);

    expect(retreat()).toEqual('');
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose energy',
      playerId: player.id,
      cost: [CardType.COLORLESS, CardType.COLORLESS],
    }));
  });

  it('Should not work while Dark Muk is on the Bench', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    setupOpponentMuk();
    const bench = TestUtils.pokemonSlot([new Grimer(), new DarkMuk()]);
    TestUtils.setDefending(sim, [new TestPokemon()]);
    opponent.bench[0] = bench;
    const retreating = player.active.getPokemonCard();

    expect(retreat()).toEqual('');
    expect(player.bench[0].getPokemonCard()).toBe(retreating);
  });

  it('Should not affect its owner\'s retreat', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    // Dark Muk retreat cost is C C; the player has G G attached
    expect(retreat()).toEqual('');
    const { prompts } = TestUtils.getAll(sim);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose energy',
      cost: [CardType.COLORLESS, CardType.COLORLESS],
    }));
  });

  [SpecialCondition.ASLEEP, SpecialCondition.CONFUSED, SpecialCondition.PARALYZED].forEach(condition => {
    it(`Should not work while Dark Muk is ${SpecialCondition[condition]}`, () => {
      const { player, opponent } = TestUtils.getAll(sim);
      setupOpponentMuk();
      opponent.active.addSpecialCondition(condition);
      const retreating = player.active.getPokemonCard();

      expect(retreat()).toEqual('');
      expect(player.bench[0].getPokemonCard()).toBe(retreating);
    });
  });

  it('Should not work when Pokémon Powers are blocked', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    setupOpponentMuk();
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);
    const retreating = player.active.getPokemonCard();

    expect(retreat()).toEqual('');
    expect(player.bench[0].getPokemonCard()).toBe(retreating);
  });

  // Sludge Punch (20) - The Defending Pokémon is now Poisoned.
  it('Should use Sludge Punch', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Sludge Punch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    expect(opponent.active.damage).toEqual(30); // 20 + 10 Poison between turns
  });
});
