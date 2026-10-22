import {
  AttackAction,
  CardType,
  GameMessage,
  Simulator,
  UseAbilityAction,
} from '@ptcg/common';

import { Dragonite } from '../../../src/base-sets/set-fossil/dragonite';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Dragonite FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Dragonite()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  function useStepIn(): string {
    const { player } = TestUtils.getAll(sim);
    const slot = player.bench.find(b => b.getPokemonCard() instanceof Dragonite) || player.active;
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Step In', TestUtils.target(sim, slot)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Step In - Once during your turn (before your attack), if Dragonite is on your Bench, you may switch it with
  // your Active Pokémon.
  it('Should use Step In from the Bench', () => {
    const { player } = TestUtils.getAll(sim);
    const active = new TestPokemon();
    const dragonite = new Dragonite();
    TestUtils.setActive(sim, [active]);
    player.bench[0] = TestUtils.pokemonSlot([dragonite]);

    const message = useStepIn();

    expect(message).toEqual('');
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.getPokemonCard()).toBe(dragonite);
    expect(player.bench[0].getPokemonCard()).toBe(active);
  });

  it('Should not use Step In twice in one turn', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TestPokemon()]);
    player.bench[0] = TestUtils.pokemonSlot([new Dragonite()]);
    player.bench[1] = TestUtils.pokemonSlot([new Dragonite()]);

    expect(useStepIn()).toEqual('');
    // a second, different Dragonite can still use its own power
    expect(useStepIn()).toEqual('');
  });

  it('Should not use the same Dragonite\'s Step In twice in one turn', () => {
    const { player } = TestUtils.getAll(sim);
    const dragonite = new Dragonite();
    TestUtils.setActive(sim, [new TestPokemon()]);
    player.bench[0] = TestUtils.pokemonSlot([dragonite]);

    expect(useStepIn()).toEqual('');
    // move it back to the bench manually and try again
    player.switchPokemon(player.bench[0]);
    expect(player.bench[0].getPokemonCard()).toBe(dragonite);

    expect(useStepIn()).toEqual(GameMessage.POWER_ALREADY_USED);
  });

  it('Should not use Step In when Dragonite is Active', () => {
    const { player } = TestUtils.getAll(sim);
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Step In', TestUtils.target(sim, player.active)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  it('Should not use Step In when Pokémon Powers are blocked', () => {
    const { player } = TestUtils.getAll(sim);
    const active = new TestPokemon();
    TestUtils.setActive(sim, [active]);
    player.bench[0] = TestUtils.pokemonSlot([new Dragonite()]);
    player.bench[1] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    const message = useStepIn();

    expect(message).toEqual(GameMessage.BLOCKED_BY_ABILITY);
    // illegal actions roll the state back to a backup copy
    const restored = TestUtils.getAll(sim).player;
    expect(restored.active.getPokemonCard()!.name).toEqual(active.name);
    expect(restored.bench[0].getPokemonCard()!.name).toEqual('Dragonite');
  });

  // Slam (40×) - Flip 2 coins. This attack does 40 damage times the number of heads.
  it('Should use Slam - 2 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Slam'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(80);
  });

  it('Should use Slam - heads, tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, true]);

    sim.dispatch(new AttackAction(1, 'Slam'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Slam - 2 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false]);

    sim.dispatch(new AttackAction(1, 'Slam'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });
});
