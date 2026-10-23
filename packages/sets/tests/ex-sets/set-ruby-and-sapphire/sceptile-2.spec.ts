import {
  AttackAction,
  CardTransfer,
  CardType,
  GameMessage,
  MoveEnergyPrompt,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
  SpecialCondition,
  UseAbilityAction,
} from '@ptcg/common';

import { Sceptile2 } from '../../../src/ex-sets/set-ruby-and-sapphire/sceptile-2';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Sceptile RS 2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Sceptile2()], [CardType.GRASS, CardType.GRASS, CardType.FIRE]);
  });

  function useEnergyTrans(): string {
    const { player } = TestUtils.getAll(sim);
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Energy Trans', TestUtils.target(sim, player.active)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Energy Trans - As often as you like during your turn (before your attack), move a G Energy card attached to 1
  // of your Pokémon to another of your Pokémon. This power can't be used if Sceptile is affected by a Special
  // Condition.
  it('Should use Energy Trans - move Grass Energy', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    const grass = player.active.energies.cards[0];

    expect(useEnergyTrans()).toEqual('');

    const prompt = TestUtils.lastPrompt(sim) as MoveEnergyPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Move energy',
      playerId: player.id,
      message: GameMessage.MOVE_ENERGY_CARDS,
      playerType: PlayerType.BOTTOM_PLAYER,
      slots: [SlotType.ACTIVE, SlotType.BENCH],
      options: jasmine.objectContaining({
        allowCancel: true,
        blockedMap: [{ source: TestUtils.target(sim, player.active), blocked: [2] }],
      }),
    }));
    const transfers: CardTransfer[] = [{
      from: TestUtils.target(sim, player.active),
      to: TestUtils.target(sim, player.bench[0]),
      card: grass,
    }];
    sim.dispatch(new ResolvePromptAction(prompt.id, transfers));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.bench[0].energies.cards).toEqual([grass]);
    expect(player.active.energies.cards.length).toEqual(2);
  });

  it('Should use Energy Trans - as often as you like', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    useEnergyTrans();
    let prompt = TestUtils.lastPrompt(sim) as MoveEnergyPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [{
      from: TestUtils.target(sim, player.active),
      to: TestUtils.target(sim, player.bench[0]),
      card: player.active.energies.cards[0],
    }]));

    expect(useEnergyTrans()).toEqual('');
    prompt = TestUtils.lastPrompt(sim) as MoveEnergyPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [{
      from: TestUtils.target(sim, player.active),
      to: TestUtils.target(sim, player.bench[0]),
      card: player.active.energies.cards[0],
    }]));

    expect(player.bench[0].energies.cards.length).toEqual(2);
    expect(player.active.energies.cards.length).toEqual(1);
  });

  it('Should use Energy Trans - affected by Special Condition', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.addSpecialCondition(SpecialCondition.POISONED);

    expect(useEnergyTrans()).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  it('Should use Energy Trans - power blocked', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    expect(useEnergyTrans()).toEqual(GameMessage.BLOCKED_BY_ABILITY);
  });

  // Tail Rap (50x) - Flip 2 coins. This attack does 50 damage times the number of heads.
  it('Should use Tail Rap - 2 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Tail Rap'));

    expect(opponent.active.damage).toEqual(100);
  });

  it('Should use Tail Rap - 1 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, true]);

    sim.dispatch(new AttackAction(1, 'Tail Rap'));

    expect(opponent.active.damage).toEqual(50);
  });

  it('Should use Tail Rap - 2 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false]);

    sim.dispatch(new AttackAction(1, 'Tail Rap'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

});
