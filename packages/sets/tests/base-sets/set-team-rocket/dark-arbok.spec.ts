import {
  AttackAction,
  CardType,
  ChoosePokemonPrompt,
  GameMessage,
  PassTurnAction,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
  SpecialCondition,
  UseAbilityAction,
} from '@ptcg/common';

import { DarkArbok } from '../../../src/base-sets/set-team-rocket/dark-arbok';
import { Charmander } from '../../../src/base-sets/set-team-rocket/charmander';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Dark Arbok TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new DarkArbok()],
      [CardType.GRASS, CardType.GRASS, CardType.GRASS]
    );
  });

  // Stare - Choose 1 of your opponent's Pokémon. This attack does 10 damage to that Pokémon. Don't apply Weakness
  // and Resistance for this attack. (Any other effects that would happen after applying Weakness and Resistance
  // still happen.) If that Pokémon has a Pokémon Power, that power stops working until the end of your opponent's
  // next turn.
  it('Should use Stare on the Defending Pokémon without Weakness', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as TestPokemon).weakness = [{ type: CardType.GRASS }];

    sim.dispatch(new AttackAction(1, 'Stare'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.ACTIVE, SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.active]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should use Stare on a Benched Pokémon without Resistance', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    const benched = new TestPokemon();
    benched.resistance = [{ type: CardType.GRASS, value: -30 }];
    opponent.bench[0] = TestUtils.pokemonSlot([benched]);

    sim.dispatch(new AttackAction(1, 'Stare'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.bench[0].damage).toEqual(10);
    expect(opponent.active.damage).toEqual(0);
  });

  function setupStaredCharmander() {
    const { opponent, prompts } = TestUtils.getAll(sim);
    const target = new Charmander();
    target.hp = 400;
    TestUtils.setDefending(sim, [target]);
    opponent.bench[0] = TestUtils.pokemonSlot([new Charmander()], [CardType.FIRE]);
    opponent.bench[1] = TestUtils.pokemonSlot([new TestPokemon()], [CardType.FIRE, CardType.FIRE]);

    sim.dispatch(new AttackAction(1, 'Stare'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.active]));
  }

  function useGatherFire(slotIndex: number | 'active'): string {
    const { opponent } = TestUtils.getAll(sim);
    const slot = slotIndex === 'active' ? opponent.active : opponent.bench[slotIndex];
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(2, 'Gather Fire', TestUtils.target(sim, slot, opponent)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  it('Should stop the chosen Pokémon\'s Pokémon Power during the opponent\'s next turn', () => {
    const { opponent } = TestUtils.getAll(sim);
    setupStaredCharmander();

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(useGatherFire('active')).toEqual(GameMessage.BLOCKED_BY_EFFECT);
  });

  it('Should not stop the Pokémon Powers of other Pokémon', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    setupStaredCharmander();

    expect(useGatherFire(0)).toEqual('');
    expect(prompts.some(p => p.type === 'Move energy' && p.playerId === opponent.id)).toBeTrue();
  });

  it('Should let the Pokémon Power work again after the opponent\'s next turn', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    setupStaredCharmander();

    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(useGatherFire('active')).toEqual('');
    expect(prompts.some(p => p.type === 'Move energy' && p.playerId === opponent.id)).toBeTrue();
  });

  // Poison Vapor (10) - The Defending Pokémon is now Poisoned. This attack does 10 damage to each of your
  // opponent's Benched Pokémon. (Don't apply Weakness and Resistance for Benched Pokémon.)
  it('Should use Poison Vapor', () => {
    const { opponent } = TestUtils.getAll(sim);
    const weak = new TestPokemon();
    weak.weakness = [{ type: CardType.GRASS }];
    opponent.bench[0] = TestUtils.pokemonSlot([weak]);
    opponent.bench[2] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Poison Vapor'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    expect(opponent.active.damage).toEqual(20); // 10 + 10 Poison between turns
    expect(opponent.bench[0].damage).toEqual(10);
    expect(opponent.bench[1].damage).toEqual(0);
    expect(opponent.bench[2].damage).toEqual(10);
  });

  it('Should apply Weakness to the Defending Pokémon with Poison Vapor', () => {
    const { opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as TestPokemon).weakness = [{ type: CardType.GRASS }];

    sim.dispatch(new AttackAction(1, 'Poison Vapor'));

    expect(opponent.active.damage).toEqual(30); // 20 + 10 Poison between turns
  });

  it('Should not be able to choose no target for Stare', () => {
    const { prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Stare'));

    expect((prompts[0] as ChoosePokemonPrompt).options.allowCancel).toBeFalse();
  });
});
