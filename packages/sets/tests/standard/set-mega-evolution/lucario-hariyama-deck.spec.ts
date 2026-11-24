import {
  AttackAction,
  CardTag,
  CardType,
  ChooseCardsPrompt,
  ChoosePokemonPrompt,
  ConfirmPrompt,
  PlayCardAction,
  PlayerType,
  PowerType,
  ResolvePromptAction,
  ShowCardsPrompt,
  Simulator,
  SlotType,
  Stage,
  TrainerType,
} from '@ptcg/common';

import { MakuhitaMEG } from '../../../src/standard/set-mega-evolution/makuhita';
import { HariyamaMEG } from '../../../src/standard/set-mega-evolution/hariyama';
import { MegaSignal } from '../../../src/standard/set-mega-evolution/mega-signal';
import { MegaLucarioEx } from '../../../src/standard/set-mega-evolution/mega-lucario-ex';
import { RioluMEG } from '../../../src/standard/set-mega-evolution/riolu';
import { Alakazam } from '../../../src/standard/set-mega-evolution/alakazam';
import { Kadabra } from '../../../src/standard/set-mega-evolution/kadabra';
import { Salvatore } from '../../../src/standard/set-temporal-forces/salvatore';
import { setMegaEvolution } from '../../../src/standard/set-mega-evolution';
import { setTemporalForces } from '../../../src/standard/set-temporal-forces';
import { TestCard } from '../../test-cards/test-card';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class FightingWeak extends TestPokemon {
  public weakness = [{ type: CardType.FIGHTING }];
}

const board = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BOARD, index: 0 };
const active = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };

describe('Lucario Hariyama deck cards', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 5;
  });

  it('Should have the printed stats', () => {
    const psychic = [{ type: CardType.PSYCHIC }];
    const makuhita = new MakuhitaMEG();
    expect([makuhita.hp, makuhita.stage, makuhita.cardTypes, makuhita.weakness, makuhita.retreat.length])
      .toEqual([80, Stage.BASIC, [CardType.FIGHTING], psychic, 2]);
    expect(makuhita.attacks.map(a => [a.name, a.cost, a.damage])).toEqual([
      ['Corkscrew Punch', [CardType.FIGHTING], '10'],
      ['Confront', [CardType.FIGHTING, CardType.FIGHTING], '30'],
    ]);
    const hariyama = new HariyamaMEG();
    expect([hariyama.hp, hariyama.stage, hariyama.evolvesFrom, hariyama.cardTypes, hariyama.weakness,
      hariyama.retreat.length, hariyama.tags]).toEqual([150, Stage.STAGE_1, 'Makuhita', [CardType.FIGHTING],
      psychic, 3, []]);
    expect(hariyama.powers.map(p => [p.name, p.powerType])).toEqual([['Heave-Ho Catcher', PowerType.ABILITY]]);
    expect(hariyama.attacks.map(a => [a.name, a.cost.length, a.damage])).toEqual([['Wild Press', 3, '210']]);
    expect(new MegaSignal().trainerType).toEqual(TrainerType.ITEM);
    expect(new Salvatore().trainerType).toEqual(TrainerType.SUPPORTER);
  });

  it('Makuhita attacks do 10 and 30', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new MakuhitaMEG()], [CardType.FIGHTING, CardType.FIGHTING]);
    sim.dispatch(new AttackAction(1, 'Confront'));
    expect(opponent.active.damage).toEqual(30);
  });

  it('Wild Press does 210 and 70 to Hariyama itself', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new MakuhitaMEG(), new HariyamaMEG()],
      [CardType.FIGHTING, CardType.FIGHTING, CardType.FIGHTING]);
    opponent.active.pokemons.cards = [new TestPokemon()];
    opponent.active.pokemons.cards[0].hp = 300;
    sim.dispatch(new AttackAction(1, 'Wild Press'));
    expect(opponent.active.damage).toEqual(210);
    expect(player.active.damage).toEqual(70);
  });

  it('Heave-Ho Catcher switches in a Benched Pokémon when Hariyama evolves from the hand', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.pokemons.cards = [new MakuhitaMEG()];
    player.active.pokemonPlayedTurn = 1;
    player.hand.cards = [new HariyamaMEG()];
    const target = new FightingWeak();
    opponent.bench[1].pokemons.cards = [target];
    sim.dispatch(new PlayCardAction(1, 0, active));
    const confirm = TestUtils.lastPrompt(sim, player) as ConfirmPrompt;
    expect(confirm instanceof ConfirmPrompt).toBeTrue();
    sim.dispatch(new ResolvePromptAction(confirm.id, true));
    const choose = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    expect(choose instanceof ChoosePokemonPrompt).toBeTrue();
    expect(choose.playerType).toEqual(PlayerType.TOP_PLAYER);
    sim.dispatch(new ResolvePromptAction(choose.id, [opponent.bench[1]]));
    expect(player.active.getPokemonCard() instanceof HariyamaMEG).toBeTrue();
    expect(opponent.active.getPokemonCard()).toBe(target);
  });

  it('Heave-Ho Catcher may be declined, and does not ask when the opponent has no Bench', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const original = opponent.active.getPokemonCard();
    player.active.pokemons.cards = [new MakuhitaMEG()];
    player.active.pokemonPlayedTurn = 1;
    player.hand.cards = [new HariyamaMEG()];
    sim.dispatch(new PlayCardAction(1, 0, active));
    expect(player.active.getPokemonCard() instanceof HariyamaMEG).toBeTrue();
    expect(TestUtils.lastPrompt(sim, player)).toBeUndefined();

    player.bench[0].pokemons.cards = [new MakuhitaMEG()];
    player.bench[0].pokemonPlayedTurn = 1;
    player.hand.cards = [new HariyamaMEG()];
    opponent.bench[0].pokemons.cards = [new TestPokemon()];
    sim.dispatch(new PlayCardAction(1, 0, { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 }));
    const confirm = TestUtils.lastPrompt(sim, player) as ConfirmPrompt;
    sim.dispatch(new ResolvePromptAction(confirm.id, false));
    expect(opponent.active.getPokemonCard()).toBe(original);
  });

  it('Mega Signal finds only a Mega Evolution Pokémon ex, reveals it and shuffles', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const lucario = new MegaLucarioEx();
    expect(lucario.tags).toContain(CardTag.MEGA_EVOLUTION_EX);
    const riolu = new RioluMEG();
    player.deck.cards = [riolu, new TestCard(), lucario];
    player.hand.cards = [new MegaSignal()];
    sim.dispatch(new PlayCardAction(1, 0, board));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt instanceof ChooseCardsPrompt).toBeTrue();
    expect(prompt.options.blocked).toEqual([0, 1]);
    sim.dispatch(new ResolvePromptAction(prompt.id, [lucario]));
    const show = TestUtils.lastPrompt(sim, opponent) as ShowCardsPrompt;
    expect(show instanceof ShowCardsPrompt).toBeTrue();
    sim.dispatch(new ResolvePromptAction(show.id, true));
    expect(player.hand.cards).toEqual([lucario]);
    expect(player.deck.cards.length).toEqual(2);
  });

  describe('Salvatore', () => {
    beforeEach(() => {
      sim.store.state.turn = 2; // the second player's first turn
    });

    it('evolves a Pokémon put down during setup straight from the deck', () => {
      const { player } = TestUtils.getAll(sim);
      player.active.pokemons.cards = [new RioluMEG()];
      player.active.pokemonPlayedTurn = 2; // setup, as SetupReducer marks the second player
      const lucario = new MegaLucarioEx();
      const hariyama = new HariyamaMEG();
      player.deck.cards = [hariyama, new TestCard(), lucario];
      player.hand.cards = [new Salvatore()];
      sim.dispatch(new PlayCardAction(1, 0, board));
      const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
      expect(prompt instanceof ChooseCardsPrompt).toBeTrue();
      // Hariyama has an Ability (and nothing in play is a Makuhita); the Test card is not a Pokémon.
      expect(prompt.options.blocked).toEqual([0, 1]);
      sim.dispatch(new ResolvePromptAction(prompt.id, [lucario]));
      expect(player.active.getPokemonCard()).toBe(lucario);
      expect(player.deck.cards.length).toEqual(2);
      expect(player.hand.cards.length).toEqual(0);
    });

    it('can\'t fetch a Pokémon that has an Ability', () => {
      const { player } = TestUtils.getAll(sim);
      player.active.pokemons.cards = [new MakuhitaMEG()];
      player.active.pokemonPlayedTurn = 1;
      player.bench[0].pokemons.cards = [new Kadabra()];
      player.bench[0].pokemonPlayedTurn = 1;
      player.deck.cards = [new HariyamaMEG(), new Alakazam()];
      player.hand.cards = [new Salvatore()];
      sim.dispatch(new PlayCardAction(1, 0, board));
      // Nothing can be chosen: the deck is still shuffled and the card is used.
      expect(TestUtils.lastPrompt(sim, player) instanceof ChooseCardsPrompt).toBeFalse();
      expect(player.active.getPokemonCard() instanceof MakuhitaMEG).toBeTrue();
      expect(player.deck.cards.length).toEqual(2);
      expect(player.hand.cards.length).toEqual(0);
    });

    it('evolves a Basic put into play this turn, but not a Pokémon that evolved this turn', () => {
      const { player } = TestUtils.getAll(sim);
      sim.store.state.turn = 6;
      player.active.pokemons.cards = [new RioluMEG()];
      player.active.pokemonPlayedTurn = 6; // benched this turn, then promoted
      player.bench[0].pokemons.cards = [new TestPokemon(), new RioluMEG()];
      player.bench[0].pokemonPlayedTurn = 6; // evolved this turn
      const lucario = new MegaLucarioEx();
      player.deck.cards = [lucario];
      player.hand.cards = [new Salvatore()];
      sim.dispatch(new PlayCardAction(1, 0, board));
      const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
      expect(prompt.options.blocked).toEqual([]);
      sim.dispatch(new ResolvePromptAction(prompt.id, [lucario]));
      // One target only, so no Pokémon prompt: the Active Riolu evolved.
      expect(player.active.getPokemonCard()).toBe(lucario);
    });

    it('asks which Pokémon to evolve when more than one can', () => {
      const { player } = TestUtils.getAll(sim);
      player.active.pokemons.cards = [new RioluMEG()];
      player.active.pokemonPlayedTurn = 1;
      player.bench[2].pokemons.cards = [new RioluMEG()];
      player.bench[2].pokemonPlayedTurn = 1;
      player.bench[3].pokemons.cards = [new TestPokemon()];
      const lucario = new MegaLucarioEx();
      player.deck.cards = [lucario];
      player.hand.cards = [new Salvatore()];
      sim.dispatch(new PlayCardAction(1, 0, board));
      const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
      sim.dispatch(new ResolvePromptAction(prompt.id, [lucario]));
      const choose = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
      expect(choose instanceof ChoosePokemonPrompt).toBeTrue();
      expect(choose.options.blocked).toEqual([{ player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 3 }]);
      sim.dispatch(new ResolvePromptAction(choose.id, [player.bench[2]]));
      expect(player.bench[2].getPokemonCard()).toBe(lucario);
      expect(player.active.getPokemonCard() instanceof RioluMEG).toBeTrue();
    });

    it('can\'t be played with an empty deck', () => {
      const { player } = TestUtils.getAll(sim);
      player.deck.cards = [];
      player.hand.cards = [new Salvatore()];
      expect(() => sim.dispatch(new PlayCardAction(1, 0, board))).toThrow();
    });
  });

  it('registers the new cards in their sets', () => {
    const names = [...setMegaEvolution, ...setTemporalForces].map(c => c.fullName);
    expect(names).toContain('Makuhita MEG');
    expect(names).toContain('Hariyama MEG');
    expect(names).toContain('Mega Signal MEG');
    expect(names).toContain('Salvatore TEF');
  });
});
