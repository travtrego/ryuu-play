import {
  CardType,
  ChoosePokemonPrompt,
  PlayCardAction,
  PlayerType,
  ResolvePromptAction,
  SelectPrompt,
  Simulator,
  SlotType,
  SpecialCondition,
  TrainerType,
} from '@ptcg/common';

import { Abra } from '../../../src/standard/set-mega-evolution/abra';
import { Alakazam } from '../../../src/standard/set-mega-evolution/alakazam';
import { Kadabra } from '../../../src/standard/set-mega-evolution/kadabra';
import { StrangeTimepiece } from '../../../src/standard/set-mega-evolution/strange-timepiece';
import { Duskull } from '../../../src/standard/set-prismatic-evolutions/duskull';
import { Dusclops } from '../../../src/standard/set-prismatic-evolutions/dusclops';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class ColorlessStage1 extends TestPokemon {
  public stage = 1;
  public evolvesFrom = 'Test';
  public cardTypes = [CardType.COLORLESS];
}

describe('Strange Timepiece MEG', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 5;
  });

  it('is an Item', () => {
    expect(new StrangeTimepiece().trainerType).toEqual(TrainerType.ITEM);
  });

  it('needs an evolved Psychic Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.pokemons.cards = [new Abra()];
    player.bench[0].pokemons.cards = [new TestPokemon(), new ColorlessStage1()];
    player.hand.cards = [new StrangeTimepiece()];
    expect(() => sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)))).toThrow();
  });

  it('devolves a Stage 1 Pokémon: the Evolution card goes to the hand; damage stays; conditions end', () => {
    const { player } = TestUtils.getAll(sim);
    const duskull = new Duskull();
    const dusclops = new Dusclops();
    player.active.pokemons.cards = [duskull, dusclops];
    player.active.damage = 20;
    player.active.addSpecialCondition(SpecialCondition.POISONED);
    player.hand.cards = [new StrangeTimepiece()];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    expect(prompt instanceof ChoosePokemonPrompt).toBeTrue();
    sim.dispatch(new ResolvePromptAction(prompt.id, [player.active]));

    expect(player.active.pokemons.cards).toEqual([duskull]);
    expect(player.hand.cards).toEqual([dusclops]);
    expect(player.active.damage).toEqual(20);
    expect(player.active.specialConditions).toEqual([]);
    expect(player.discard.cards.length).toEqual(1);
  });

  it('can take one or both Evolution cards off a Stage 2, and that Pokémon can\'t evolve again this turn', () => {
    const { player } = TestUtils.getAll(sim);
    const abra = new Abra();
    const kadabra = new Kadabra();
    const alakazam = new Alakazam();
    player.active.pokemons.cards = [abra, kadabra, alakazam];
    player.active.pokemonPlayedTurn = 2;
    player.hand.cards = [new StrangeTimepiece()];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    const prompt = TestUtils.lastPrompt(sim, player)!;
    sim.dispatch(new ResolvePromptAction(prompt.id, [player.active]));
    const select = TestUtils.lastPrompt(sim, player) as SelectPrompt;
    expect(select instanceof SelectPrompt).toBeTrue();
    expect(select.values).toEqual(['Kadabra', 'Abra']);
    sim.dispatch(new ResolvePromptAction(select.id, 1));

    expect(player.active.pokemons.cards).toEqual([abra]);
    expect(player.hand.cards).toContain(kadabra);
    expect(player.hand.cards).toContain(alakazam);

    // "(That Pokémon can't evolve this turn.)"
    const kadabraIndex = player.hand.cards.indexOf(kadabra);
    expect(() => sim.dispatch(new PlayCardAction(1, kadabraIndex,
      { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 }))).toThrow();
  });

  it('a devolved Pokémon with too much damage is Knocked Out', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0].pokemons.cards = [new Abra(), new Kadabra()];
    player.bench[0].damage = 60; // Abra has 50 HP
    player.hand.cards = [new StrangeTimepiece()];
    const prizes = opponent.getPrizeLeft();

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    const prompt = TestUtils.lastPrompt(sim, player)!;
    sim.dispatch(new ResolvePromptAction(prompt.id, [player.bench[0]]));
    let prizePrompt = TestUtils.lastPrompt(sim, opponent);
    while (prizePrompt !== undefined && opponent.getPrizeLeft() === prizes) {
      sim.dispatch(new ResolvePromptAction(prizePrompt.id, [opponent.prizes[0]]));
      prizePrompt = TestUtils.lastPrompt(sim, opponent);
    }
    expect(player.bench[0].pokemons.cards.length).toEqual(0);
    expect(opponent.getPrizeLeft()).toEqual(prizes - 1);
  });
});
