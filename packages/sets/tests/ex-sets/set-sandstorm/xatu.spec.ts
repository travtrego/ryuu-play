import {
  AttackAction,
  CardType,
  GameMessage,
  PassTurnAction,
  Simulator,
  SpecialCondition,
  UseAbilityAction,
} from '@ptcg/common';

import { Xatu } from '../../../src/ex-sets/set-sandstorm/xatu';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Xatu SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Xatu()], [CardType.PSYCHIC, CardType.COLORLESS]);
  });

  function useHealingWind(): string {
    const { player } = TestUtils.getAll(sim);
    const xatuSlot = player.active.getPokemonCard() instanceof Xatu ? player.active : player.bench[0];
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Healing Wind', TestUtils.target(sim, xatuSlot)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Healing Wind - Once during your turn (before your attack), you may remove 1 damage counter from each of your
  // Active Pokémon. This power can't be used if Xatu is affected by a Special Condition.
  it('Should use Healing Wind', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.damage = 30;

    expect(useHealingWind()).toEqual('');

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(20);
  });

  it('Should use Healing Wind from the Bench on the Active Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TestPokemon()]);
    player.active.damage = 30;
    player.bench[0] = TestUtils.pokemonSlot([new Xatu()], [], [], 30);

    expect(useHealingWind()).toEqual('');

    expect(player.active.damage).toEqual(20);
    expect(player.bench[0].damage).toEqual(30);
  });

  it('Should use Healing Wind only once per turn', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.damage = 30;

    expect(useHealingWind()).toEqual('');
    expect(useHealingWind()).toEqual(GameMessage.POWER_ALREADY_USED);
    expect(player.active.damage).toEqual(20);
  });

  it('Should use Healing Wind again during the next turn', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.damage = 30;

    expect(useHealingWind()).toEqual('');
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new PassTurnAction(2));
    expect(useHealingWind()).toEqual('');

    expect(player.active.damage).toEqual(10);
  });

  it('Should not use Healing Wind when the Active Pokémon has no damage counters', () => {
    expect(useHealingWind()).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  it('Should not use Healing Wind when Xatu is affected by a Special Condition', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.damage = 30;
    player.active.addSpecialCondition(SpecialCondition.CONFUSED);

    expect(useHealingWind()).toEqual(GameMessage.CANNOT_USE_POWER);
    expect(player.active.damage).toEqual(30);
  });

  // Psyimpact - Put 1 damage counter on each of your opponent's Pokémon.
  it('Should use Psyimpact', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const defending = new TestPokemon();
    defending.weakness = [{ type: CardType.PSYCHIC }];
    TestUtils.setDefending(sim, [defending]);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[2] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Psyimpact'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.bench[0].damage).toEqual(10);
    expect(opponent.bench[2].damage).toEqual(10);
    expect(player.bench[0].damage).toEqual(0);
  });
});
