import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { DarkSlowbro } from '../../../src/base-sets/set-team-rocket/dark-slowbro';
import { Slowpoke } from '../../../src/base-sets/set-team-rocket/slowpoke';
import { Charmander } from '../../../src/base-sets/set-team-rocket/charmander';
import { DarkCharmeleon } from '../../../src/base-sets/set-team-rocket/dark-charmeleon';
import { Sleep } from '../../../src/base-sets/set-team-rocket/sleep';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Dark Slowbro TR', () => {
  let sim: Simulator;
  let slowbro: DarkSlowbro;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 3;
    slowbro = new DarkSlowbro();

    TestUtils.setActive(sim, [new Slowpoke()], [CardType.PSYCHIC, CardType.PSYCHIC]);
    sim.store.state.players[0].hand.cards = [slowbro];
  });

  // Reel In - When you play Dark Slowbro from your hand, choose up to 3 Basic Pokémon and/or Evolution cards from
  // your discard pile and put them into your hand.
  it('Should use Reel In to put up to 3 Pokémon cards from the discard pile into the hand', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const pokemons = [new Charmander(), new DarkCharmeleon(), new Charmander(), new Charmander()];
    const sleep = new Sleep();
    const [energy] = TestUtils.makeEnergies([CardType.FIRE]);
    player.discard.cards = [...pokemons, sleep, energy];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    const prompt = prompts[0] as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      options: jasmine.objectContaining({ min: 0, max: 3 }),
    }));
    expect(prompt.validate([sleep])).toBeFalse();
    expect(prompt.validate([energy])).toBeFalse();
    expect(prompt.validate(pokemons)).toBeFalse();
    sim.dispatch(new ResolvePromptAction(prompt.id, pokemons.slice(0, 3)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.getPokemonCard()).toBe(slowbro);
    expect(player.hand.cards).toEqual(pokemons.slice(0, 3));
    expect(player.discard.cards).toEqual([pokemons[3], sleep, energy]);
  });

  it('Should allow choosing nothing with Reel In', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.discard.cards = [new Charmander()];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, []));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.getPokemonCard()).toBe(slowbro);
    expect(player.hand.cards).toEqual([]);
    expect(player.discard.cards.length).toEqual(1);
  });

  it('Should evolve without a prompt when there are no Pokémon in the discard pile', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.discard.cards = [new Sleep()];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect(prompts.length).toEqual(0);
    expect(player.active.getPokemonCard()).toBe(slowbro);
  });

  it('Should not use Reel In when Pokémon Powers are blocked', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    player.discard.cards = [new Charmander()];
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect(prompts.length).toEqual(0);
    expect(player.active.getPokemonCard()).toBe(slowbro);
    expect(player.discard.cards.length).toEqual(1);
  });

  // Fickle Attack (40) - Flip a coin. If tails, this attack does nothing.
  it('Should use Fickle Attack - heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Slowpoke(), slowbro], [CardType.PSYCHIC, CardType.PSYCHIC]);
    player.hand.cards = [];
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Fickle Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Fickle Attack - tails', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Slowpoke(), slowbro], [CardType.PSYCHIC, CardType.PSYCHIC]);
    player.hand.cards = [];
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Fickle Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });
});
