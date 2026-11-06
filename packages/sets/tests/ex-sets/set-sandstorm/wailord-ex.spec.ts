import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { WailordEx } from '../../../src/ex-sets/set-sandstorm/wailord-ex';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Wailord ex SS', () => {
  let sim: Simulator;
  let wailord: WailordEx;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    wailord = new WailordEx();

    TestUtils.setActive(
      sim,
      [wailord],
      [CardType.WATER, CardType.WATER, CardType.WATER, CardType.COLORLESS]
    );
  });

  // Super Deep Dive - If you don't have any Benched Pokémon, this attack does nothing. Remove 3 damage counters from
  // Wailord ex. Switch Wailord ex with 1 of your Benched Pokémon.
  it('Should use Super Deep Dive', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const benched = new TestPokemon();
    player.bench[0] = TestUtils.pokemonSlot([benched]);
    player.active.damage = 50;

    sim.dispatch(new AttackAction(1, 'Super Deep Dive'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,
      slots: [SlotType.BENCH],
      options: jasmine.objectContaining({ allowCancel: false })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.getPokemonCard()).toBe(benched);
    expect(player.bench[0].getPokemonCard()).toBe(wailord);
    expect(player.bench[0].damage).toEqual(20);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Super Deep Dive without Benched Pokémon (does nothing)', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    player.active.damage = 50;

    sim.dispatch(new AttackAction(1, 'Super Deep Dive'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.getPokemonCard()).toBe(wailord);
    expect(player.active.damage).toEqual(50);
  });

  // Dwindling Wave (100-) - Does 100 damage minus 10 damage for each damage counter on Wailord ex.
  it('Should use Dwindling Wave without damage counters', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Dwindling Wave'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(100);
  });

  it('Should use Dwindling Wave with damage counters', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.damage = 30;

    sim.dispatch(new AttackAction(1, 'Dwindling Wave'));

    expect(opponent.active.damage).toEqual(70);
  });

  it('Should use Dwindling Wave doing no damage with 10 or more damage counters', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.damage = 120;

    sim.dispatch(new AttackAction(1, 'Dwindling Wave'));

    expect(opponent.active.damage).toEqual(0);
  });
});
