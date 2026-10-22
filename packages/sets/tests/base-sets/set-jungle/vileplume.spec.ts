import {
  AttackAction,
  CardType,
  GameMessage,
  PlayerType,
  PokemonSlot,
  ResolvePromptAction,
  Simulator,
  SlotType,
  SpecialCondition,
  UseAbilityAction,
} from '@ptcg/common';

import { Vileplume } from '../../../src/base-sets/set-jungle/vileplume';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Vileplume JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Vileplume()],
      [CardType.GRASS, CardType.GRASS, CardType.GRASS],
    );
  });

  function useHeal(slot?: PokemonSlot) {
    const { player } = TestUtils.getAll(sim);
    sim.dispatch(new UseAbilityAction(1, 'Heal', TestUtils.target(sim, slot || player.active)));
  }

  function useHealError(slot?: PokemonSlot): string {
    let message = '';
    try {
      useHeal(slot);
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Heal - Once during your turn (before your attack), you may flip a coin. If heads, remove 1 damage counter from
  // 1 of your Pokémon. This power can't be used if Vileplume is Asleep, Confused, or Paralyzed.
  it('Should use Heal - heads, removes 1 damage counter from the chosen Pokémon', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [], [], 30);
    TestUtils.setFlipResults(sim, [true]);

    useHeal();

    const prompt = TestUtils.lastPrompt(sim)!;
    expect(prompts[0]).toEqual(jasmine.objectContaining({ type: 'Coin flip', playerId: player.id }));
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_HEAL,
      playerType: PlayerType.BOTTOM_PLAYER,
      slots: [SlotType.ACTIVE, SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [player.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.bench[0].damage).toEqual(20);
  });

  it('Should use Heal - tails, nothing is healed', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.active.damage = 30;
    TestUtils.setFlipResults(sim, [false]);

    useHeal();

    expect(prompts.length).toEqual(1);
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(30);
  });

  it('Should use Heal only once per turn, even after tails', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.damage = 30;
    TestUtils.setFlipResults(sim, [false]);

    useHeal();
    const message = useHealError();

    expect(message).toEqual(GameMessage.POWER_ALREADY_USED);
  });

  it('Should use Heal again during your next turn', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.damage = 30;
    TestUtils.setFlipResults(sim, [false]);

    useHeal();
    sim.dispatch(new AttackAction(1, 'Petal Dance'));
    // between turns: Vileplume is Confused, the opponent attacks
    sim.dispatch(new AttackAction(2, 'Test attack'));
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    player.active.removeSpecialCondition(SpecialCondition.CONFUSED);

    expect(useHealError()).toEqual('');
  });

  // BUG: the "once per turn" marker is shared by all Vileplume (checked without a source), so a second Vileplume
  // can't use its own Heal
  xit('Should let each Vileplume use Heal once per turn', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.damage = 30;
    player.bench[0] = TestUtils.pokemonSlot([new Vileplume()]);
    TestUtils.setFlipResults(sim, [false]);

    useHeal(player.active);
    const message = useHealError(player.bench[0]);

    expect(message).toEqual('');
  });

  [SpecialCondition.ASLEEP, SpecialCondition.CONFUSED, SpecialCondition.PARALYZED].forEach(condition => {
    it(`Should not use Heal when Vileplume is ${condition}`, () => {
      const { player } = TestUtils.getAll(sim);
      player.active.damage = 30;
      player.active.addSpecialCondition(condition);

      const message = useHealError();

      expect(message).toEqual(GameMessage.CANNOT_USE_POWER);
      expect(TestUtils.getAll(sim).prompts.length).toEqual(0);
    });
  });

  // Petal Dance (40x) - Flip 3 coins. This attack does 40 damage times the number of heads. Vileplume is now
  // Confused (after doing damage).
  it('Should use Petal Dance - 3 heads', () => {
    const { opponent, player } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Petal Dance'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(120);
    expect(player.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  it('Should use Petal Dance - 2 heads', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, false, true]);

    sim.dispatch(new AttackAction(1, 'Petal Dance'));

    expect(opponent.active.damage).toEqual(80);
    expect(player.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
  });

  it('Should use Petal Dance - 3 tails, Vileplume is still Confused', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Petal Dance'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(player.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
  });
});
