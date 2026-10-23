import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  Stage,
} from '@ptcg/common';

import { Kabuto } from '../../../src/ex-sets/set-sandstorm/kabuto';
import { Omanyte } from '../../../src/ex-sets/set-sandstorm/omanyte';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Kabuto SS', () => {
  let sim: Simulator;
  let attacker: TestPokemon;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Kabuto()], [CardType.FIGHTING, CardType.COLORLESS]);

    attacker = new TestPokemon();
    attacker.attacks = [{ name: 'Test attack', cost: [], damage: '30', text: '' }];
    TestUtils.setDefending(sim, [attacker]);
  });

  function opponentAttacks() {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActivePlayer(sim, opponent);
    sim.dispatch(new AttackAction(2, 'Test attack'));
  }

  // Exoskeleton - Any damage done to Kabuto by attacks is reduced by 20 (after applying Weakness and Resistance).
  it('Should reduce damage done to Kabuto by 20', () => {
    const { player } = TestUtils.getAll(sim);

    opponentAttacks();

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
  });

  it('Should reduce damage by 20 after applying Weakness', () => {
    const { player } = TestUtils.getAll(sim);
    attacker.cardTypes = [CardType.GRASS];

    opponentAttacks();

    // 30 x 2 - 20
    expect(player.active.damage).toEqual(40);
  });

  it('Should not reduce damage when Exoskeleton is blocked', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    opponentAttacks();

    expect(player.active.damage).toEqual(30);
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

  // Pierce (20)
  it('Should use Pierce', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Pierce'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });
});
