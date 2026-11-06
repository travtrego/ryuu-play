import {
  AttackAction,
  CardType,
  DamageTransfer,
  GameMessage,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
  SpecialCondition,
  UseAbilityAction,
} from '@ptcg/common';

import { Gengar } from '../../../src/base-sets/set-fossil/gengar';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Gengar FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Gengar()],
      [CardType.PSYCHIC, CardType.PSYCHIC, CardType.PSYCHIC]
    );
  });

  function useCurse(): string {
    const { player } = TestUtils.getAll(sim);
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Curse', TestUtils.target(sim, player.active)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Curse - Once during your turn (before your attack), you may move 1 damage counter from 1 of your opponent's
  // Pokémon to another (even if it would Knock Out the other Pokémon). This power can't be used if Gengar is Asleep,
  // Confused, or Paralyzed.
  it('Should use Curse to move 1 damage counter between opponent\'s Pokémon', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    opponent.active.damage = 30;
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    expect(useCurse()).toEqual('');
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Move damage',
      playerId: player.id,
      message: GameMessage.MOVE_DAMAGE,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.ACTIVE, SlotType.BENCH],
      options: jasmine.objectContaining({ min: 1, max: 1 })
    }));

    const transfers: DamageTransfer[] = [{
      from: TestUtils.target(sim, opponent.active),
      to: TestUtils.target(sim, opponent.bench[0]),
    }];
    sim.dispatch(new ResolvePromptAction(prompts[0].id, transfers));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.bench[0].damage).toEqual(10);
  });

  it('Should use Curse even if it would Knock Out the other Pokémon', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    const benched = new TestPokemon();
    opponent.active.damage = 10;
    opponent.bench[0] = TestUtils.pokemonSlot([benched], [], [], 390);

    expect(useCurse()).toEqual('');
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [{
      from: TestUtils.target(sim, opponent.active),
      to: TestUtils.target(sim, opponent.bench[0]),
    }]));

    expect(opponent.active.damage).toEqual(0);
    expect(opponent.discard.cards).toContain(benched);
  });

  it('Should not use Curse twice in one turn', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    opponent.active.damage = 30;
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    expect(useCurse()).toEqual('');
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [{
      from: TestUtils.target(sim, opponent.active),
      to: TestUtils.target(sim, opponent.bench[0]),
    }]));

    expect(useCurse()).toEqual(GameMessage.POWER_ALREADY_USED);
  });

  [SpecialCondition.ASLEEP, SpecialCondition.CONFUSED, SpecialCondition.PARALYZED].forEach(condition => {
    it(`Should not use Curse while Gengar is ${SpecialCondition[condition]}`, () => {
      const { player, opponent } = TestUtils.getAll(sim);
      player.active.specialConditions.push(condition);
      opponent.active.damage = 30;
      opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

      expect(useCurse()).toEqual(GameMessage.CANNOT_USE_POWER);
    });
  });

  it('Should not use Curse when Pokémon Powers are blocked', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.active.damage = 30;
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    expect(useCurse()).toEqual(GameMessage.BLOCKED_BY_ABILITY);
  });

  it('Should not use Curse when the opponent has no damage counters', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    expect(useCurse()).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  // Dark Mind (30) - If your opponent has any Benched Pokémon, choose 1 of them and this attack does 10 damage to it.
  // (Don't apply Weakness and Resistance for Benched Pokémon.)
  it('Should use Dark Mind', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const weak = new TestPokemon();
    weak.weakness = [{ type: CardType.PSYCHIC }];
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[1] = TestUtils.pokemonSlot([weak]);

    sim.dispatch(new AttackAction(1, 'Dark Mind'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[1]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.bench[0].damage).toEqual(0);
    expect(opponent.bench[1].damage).toEqual(10);
  });

  it('Should use Dark Mind without Benched Pokémon', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Dark Mind'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });
});
