import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
  Stage,
} from '@ptcg/common';

import { Kabuto } from '../../../src/ex-sets/set-sandstorm/kabuto';
import { Omanyte } from '../../../src/ex-sets/set-sandstorm/omanyte';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Omanyte SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Omanyte()], [CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Team Assembly - Search your deck for Omanyte, Kabuto, or any Basic Pokémon and put as many of them as you like
  // onto your Bench. Shuffle your deck afterward. Treat the new Benched Pokémon as Basic Pokémon.
  it('Should use Team Assembly', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const omanyte = new Omanyte();
    const kabuto = new Kabuto();
    const basic = new TestPokemon();
    const stage1 = new TestPokemon();
    stage1.stage = Stage.STAGE_1;
    player.deck.cards = [omanyte, stage1, kabuto, basic];

    sim.dispatch(new AttackAction(1, 'Team Assembly'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_PUT_ONTO_BENCH,
      cards: player.deck,
      options: jasmine.objectContaining({ min: 0, max: 5, allowCancel: false })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [omanyte, kabuto, basic]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.bench[0].pokemons.cards).toEqual([omanyte]);
    expect(player.bench[1].pokemons.cards).toEqual([kabuto]);
    expect(player.bench[2].pokemons.cards).toEqual([basic]);
    expect(player.deck.cards).toEqual([stage1]);
  });

  it('Should use Team Assembly and choose nothing', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const basic = new TestPokemon();
    player.deck.cards = [basic];

    sim.dispatch(new AttackAction(1, 'Team Assembly'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, []));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.bench[0].pokemons.cards).toEqual([]);
    expect(player.deck.cards).toEqual([basic]);
  });

  // Bind (20) - Flip a coin. If heads, the Defending Pokémon is now Paralyzed.
  it('Should use Bind - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Bind'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Bind - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Bind'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([]);
  });
});
