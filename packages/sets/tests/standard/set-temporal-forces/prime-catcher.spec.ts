import { CardTag, PlayCardAction, ResolvePromptAction, Simulator, TrainerType } from '@ptcg/common';

import { PrimeCatcher } from '../../../src/standard/set-temporal-forces/prime-catcher';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Prime Catcher TEF', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  it('is an ACE SPEC Item', () => {
    const card = new PrimeCatcher();
    expect(card.tags).toContain(CardTag.ACE_SPEC);
    expect(card.trainerType).toEqual(TrainerType.ITEM);
  });

  it('can\'t be played when the opponent has no Benched Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [new PrimeCatcher()];
    expect(() => sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)))).toThrow();
  });

  it('brings up an opponent\'s Benched Pokémon, then switches your Active Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const oldOpponentActive = opponent.active.getPokemonCard();
    const oldActive = player.active.getPokemonCard();
    const theirs = new TestPokemon();
    const mine = new TestPokemon();
    opponent.bench[2].pokemons.cards = [theirs];
    player.bench[1].pokemons.cards = [mine];
    player.hand.cards = [new PrimeCatcher()];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    let prompt = TestUtils.lastPrompt(sim, player)!;
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[2]]));
    prompt = TestUtils.lastPrompt(sim, player)!;
    sim.dispatch(new ResolvePromptAction(prompt.id, [player.bench[1]]));

    expect(opponent.active.getPokemonCard()).toBe(theirs);
    expect(opponent.bench[2].getPokemonCard()).toBe(oldOpponentActive);
    expect(player.active.getPokemonCard()).toBe(mine);
    expect(player.bench[1].getPokemonCard()).toBe(oldActive);
    expect(player.hand.cards.length).toEqual(0);
  });

  it('with nothing on your own Bench, only the opponent\'s Pokémon are switched', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const theirs = new TestPokemon();
    opponent.bench[0].pokemons.cards = [theirs];
    player.hand.cards = [new PrimeCatcher()];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    const prompt = TestUtils.lastPrompt(sim, player)!;
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[0]]));
    expect(opponent.active.getPokemonCard()).toBe(theirs);
    expect(player.discard.cards.length).toEqual(1);
  });
});
