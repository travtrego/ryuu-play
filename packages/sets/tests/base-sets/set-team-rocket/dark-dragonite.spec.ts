import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { DarkDragonite } from '../../../src/base-sets/set-team-rocket/dark-dragonite';
import { DarkDragonair } from '../../../src/base-sets/set-team-rocket/dark-dragonair';
import { Dratini } from '../../../src/base-sets/set-team-rocket/dratini';
import { Charmander } from '../../../src/base-sets/set-team-rocket/charmander';
import { DarkCharmeleon } from '../../../src/base-sets/set-team-rocket/dark-charmeleon';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Dark Dragonite TR', () => {
  let sim: Simulator;
  let dragonite: DarkDragonite;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 3;
    dragonite = new DarkDragonite();

    TestUtils.setActive(
      sim,
      [new Dratini(), new DarkDragonair()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]
    );
    sim.store.state.players[0].hand.cards = [dragonite];
  });

  // Summon Minions - When you play Dark Dragonite from your hand, search your deck for up to 2 Basic Pokémon and
  // put them onto your Bench. Shuffle your deck afterward.
  it('Should use Summon Minions when evolving', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const basics = [new Charmander(), new Dratini(), new Charmander()];
    const evolution = new DarkCharmeleon();
    player.deck.cards = [...basics, evolution, ...TestUtils.makeTestCards(2)];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    const prompt = prompts[0] as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      options: jasmine.objectContaining({ min: 0, max: 2 }),
    }));
    expect(prompt.validate([evolution])).toBeFalse();
    expect(prompt.validate(basics)).toBeFalse();
    sim.dispatch(new ResolvePromptAction(prompt.id, [basics[0], basics[1]]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.getPokemonCard()).toBe(dragonite);
    expect(player.bench[0].pokemons.cards).toEqual([basics[0]]);
    expect(player.bench[1].pokemons.cards).toEqual([basics[1]]);
    expect(player.deck.cards.length).toEqual(4);
    expect(prompts.some(p => p.type === 'Shuffle deck' && p.playerId === player.id)).toBeTrue();
  });

  it('Should only allow as many Basic Pokémon as there is room on the Bench', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    for (let i = 0; i < 4; i++) {
      player.bench[i] = TestUtils.pokemonSlot([new TestPokemon()]);
    }
    player.deck.cards = [new Charmander(), new Charmander()];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect((prompts[0] as ChooseCardsPrompt).options.max).toEqual(1);
  });

  it('Should allow choosing no Basic Pokémon', () => {
    const { player, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, []));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.getPokemonCard()).toBe(dragonite);
    expect(player.bench.every(b => b.pokemons.cards.length === 0)).toBeTrue();
  });

  it('Should not use Summon Minions when Pokémon Powers are blocked', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.getPokemonCard()).toBe(dragonite);
  });

  // Giant Tail (70) - Flip a coin. If tails, this attack does nothing.
  it('Should use Giant Tail - heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [dragonite], [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]);
    player.hand.cards = [];
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Giant Tail'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(70);
  });

  it('Should use Giant Tail - tails', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [dragonite], [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]);
    player.hand.cards = [];
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Giant Tail'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });
});
