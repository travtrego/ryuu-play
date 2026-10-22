import {
  AttackAction,
  CardType,
  DamageTransfer,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
  UseAbilityAction,
} from '@ptcg/common';

import { Slowbro } from '../../../src/base-sets/set-fossil/slowbro';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Slowbro FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Slowbro()],
      [CardType.PSYCHIC, CardType.PSYCHIC]
    );
  });

  function useStrangeBehavior(): string {
    const { player } = TestUtils.getAll(sim);
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Strange Behavior', TestUtils.target(sim, player.active)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Strange Behavior - As often as you like during your turn (before your attack), you may move 1 damage counter
  // from 1 of your Pokémon to Slowbro as long as you don't Knock Out Slowbro. This power can't be used if Slowbro is
  // Asleep, Confused, or Paralyzed.
  it('Should use Strange Behavior to move damage counters to Slowbro', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [], [], 30);

    expect(useStrangeBehavior()).toEqual('');
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Move damage',
      playerId: player.id,
      message: GameMessage.MOVE_DAMAGE
    }));

    const transfer: DamageTransfer = {
      from: TestUtils.target(sim, player.bench[0]),
      to: TestUtils.target(sim, player.active),
    };
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [transfer, transfer]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(20);
    expect(player.bench[0].damage).toEqual(10);
  });

  it('Should use Strange Behavior again in the same turn', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [], [], 30);
    const transfer: DamageTransfer = {
      from: TestUtils.target(sim, player.bench[0]),
      to: TestUtils.target(sim, player.active),
    };

    expect(useStrangeBehavior()).toEqual('');
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [transfer]));
    expect(useStrangeBehavior()).toEqual('');
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [transfer]));

    expect(player.active.damage).toEqual(20);
    expect(player.bench[0].damage).toEqual(10);
  });

  it('Should not allow Strange Behavior to Knock Out Slowbro', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [], [], 30);
    player.active.damage = 40;

    expect(useStrangeBehavior()).toEqual('');
    // Slowbro has 60 HP, so it can hold at most 50 damage
    const damageMap = (prompts[0] as any).maxAllowedDamage
      .find((m: any) => m.target.slot === TestUtils.target(sim, player.active).slot);
    expect(damageMap.damage).toEqual(50);
  });

  it('Should not use Strange Behavior when Slowbro would be Knocked Out', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [], [], 30);
    player.active.damage = 50;

    expect(useStrangeBehavior()).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  [SpecialCondition.ASLEEP, SpecialCondition.CONFUSED, SpecialCondition.PARALYZED].forEach(condition => {
    it(`Should not use Strange Behavior while Slowbro is ${SpecialCondition[condition]}`, () => {
      const { player } = TestUtils.getAll(sim);
      player.active.specialConditions.push(condition);
      player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [], [], 30);

      expect(useStrangeBehavior()).toEqual(GameMessage.CANNOT_USE_POWER);
    });
  });

  it('Should not use Strange Behavior when Pokémon Powers are blocked', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [], [], 30);
    player.bench[1] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    expect(useStrangeBehavior()).toEqual(GameMessage.BLOCKED_BY_ABILITY);
  });

  // Psyshock (20) - Flip a coin. If heads, the Defending Pokémon is now Paralyzed.
  it('Should use Psyshock - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Psyshock'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Psyshock - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Psyshock'));

    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([]);
  });
});
