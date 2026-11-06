import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
  UseAbilityAction,
} from '@ptcg/common';

import { Tentacool } from '../../../src/base-sets/set-fossil/tentacool';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Tentacool FO', () => {
  let sim: Simulator;
  let tentacool: Tentacool;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 3;
    tentacool = new Tentacool();

    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([tentacool], [CardType.WATER], [], 10);
    player.bench[0].pokemonPlayedTurn = 1;
  });

  function useCowardice(slotIndex = 0): string {
    const { player } = TestUtils.getAll(sim);
    const slot = slotIndex < 0 ? player.active : player.bench[slotIndex];
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Cowardice', TestUtils.target(sim, slot)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Cowardice - At any time during your turn (before your attack), you may return Tentacool to your hand. (Discard
  // all cards attached to Tentacool.) This power can't be used the turn you put Tentacool into play or if Tentacool
  // is Asleep, Confused, or Paralyzed.
  it('Should use Cowardice to return Tentacool to hand', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const [energy] = player.bench[0].energies.cards;

    expect(useCowardice()).toEqual('');
    expect(prompts[0].type).toEqual('Confirm');
    sim.dispatch(new ResolvePromptAction(prompts[0].id, true));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([tentacool]);
    expect(player.discard.cards).toEqual([energy]);
    expect(player.bench[0].pokemons.cards).toEqual([]);
    expect(player.bench[0].damage).toEqual(0);
  });

  it('Should keep Tentacool in play when not confirmed', () => {
    const { player, prompts } = TestUtils.getAll(sim);

    expect(useCowardice()).toEqual('');
    sim.dispatch(new ResolvePromptAction(prompts[0].id, false));

    expect(player.bench[0].pokemons.cards).toEqual([tentacool]);
    expect(player.hand.cards).toEqual([]);
  });

  it('Should not use Cowardice the turn Tentacool was put into play', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0].pokemonPlayedTurn = 3;

    expect(useCowardice()).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  [SpecialCondition.ASLEEP, SpecialCondition.CONFUSED, SpecialCondition.PARALYZED].forEach(condition => {
    it(`Should not use Cowardice while Tentacool is ${SpecialCondition[condition]}`, () => {
      const { player } = TestUtils.getAll(sim);
      player.switchPokemon(player.bench[0]);
      player.active.pokemonPlayedTurn = 1;
      player.active.specialConditions.push(condition);

      expect(useCowardice(-1)).toEqual(GameMessage.CANNOT_USE_POWER);
    });
  });

  it('Should not use Cowardice when Pokémon Powers are blocked', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[1] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    expect(useCowardice()).toEqual(GameMessage.BLOCKED_BY_ABILITY);
  });

  // Acid (10)
  it('Should use Acid', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Tentacool()], [CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Acid'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });
});
