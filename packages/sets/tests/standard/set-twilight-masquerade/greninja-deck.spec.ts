import {
  AddSpecialConditionsEffect,
  AttackAction,
  AttackEffect,
  CardTag,
  CardType,
  CheckProvidedEnergyEffect,
  ChooseCardsPrompt,
  ChoosePokemonPrompt,
  Effect,
  GameError,
  GameMessage,
  PassTurnAction,
  PlayCardAction,
  PlayerType,
  PutDamageEffect,
  ResolvePromptAction,
  ShowCardsPrompt,
  ShuffleDeckPrompt,
  Simulator,
  SlotType,
  SpecialCondition,
  Stage,
  State,
  StoreLike,
  TrainerType,
  UseStadiumAction,
} from '@ptcg/common';

import { FroakieCRI } from '../../../src/standard/set-chaos-rising/froakie';
import { FrogadierCRI } from '../../../src/standard/set-chaos-rising/frogadier';
import { BubblyWaterEnergy } from '../../../src/standard/set-chaos-rising/bubbly-water-energy';
import { GreninjaEx } from '../../../src/standard/set-twilight-masquerade/greninja-ex';
import { StaryuPOR } from '../../../src/standard/set-perfect-order/staryu';
import { MegaStarmieEx } from '../../../src/standard/set-perfect-order/mega-starmie-ex';
import { ColresssTenacity } from '../../../src/standard/set-shrouded-fable/colresss-tenacity';
import { GrandTree } from '../../../src/standard/set-stellar-crown/grand-tree';
import { IgnitionEnergy } from '../../../src/standard/set-white-flare/ignition-energy';
import { TestCard } from '../../test-cards/test-card';
import { TestEnergy } from '../../test-cards/test-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

/** Takes 100 less damage from attacks (an effect on the Defending Pokémon). */
class Shielded extends TestPokemon {
  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PutDamageEffect && effect.target.pokemons.cards.includes(this)) {
      effect.damage = Math.max(0, effect.damage - 100);
    }
    return state;
  }
}

class WeakToFighting extends TestPokemon {
  public weakness = [{ type: CardType.FIGHTING }];
}

class WeakToWater extends TestPokemon {
  public weakness = [{ type: CardType.WATER }];
}

class WaterPokemon extends TestPokemon {
  public cardTypes = [CardType.WATER];
}

const hand = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BOARD, index: 0 };

describe('Greninja deck cards', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 5;
  });

  function code(action: () => void): string {
    try {
      action();
    } catch (e) {
      return (e as GameError).message;
    }
    return 'ok';
  }

  /** Resolves a pending reveal to the opponent and a deck shuffle, if the arbiter left them. */
  function shuffle(): void {
    const { player, opponent } = TestUtils.getAll(sim);
    const show = TestUtils.lastPrompt(sim, opponent);
    if (show instanceof ShowCardsPrompt && show.result === undefined) {
      sim.dispatch(new ResolvePromptAction(show.id, true));
    }
    const prompt = TestUtils.lastPrompt(sim, player);
    if (prompt instanceof ShuffleDeckPrompt && prompt.result === undefined) {
      sim.dispatch(new ResolvePromptAction(prompt.id, [...Array(player.deck.cards.length).keys()]));
    }
  }

  it('Should have the printed stats', () => {
    const gren = new GreninjaEx();
    expect([gren.hp, gren.stage, gren.evolvesFrom, gren.cardTypes, gren.weakness, gren.retreat.length, gren.tags])
      .toEqual([310, Stage.STAGE_2, 'Frogadier', [CardType.FIGHTING], [{ type: CardType.PSYCHIC }], 1,
        [CardTag.POKEMON_EX, CardTag.TERA]]);
    expect(gren.attacks.map(a => [a.cost, a.damage])).toEqual([
      [[CardType.WATER], '170'],
      [[CardType.WATER, CardType.COLORLESS, CardType.COLORLESS], ''],
    ]);
    const frog = new FrogadierCRI();
    expect([frog.hp, frog.stage, frog.evolvesFrom, frog.cardTypes, frog.weakness, frog.retreat.length])
      .toEqual([100, Stage.STAGE_1, 'Froakie', [CardType.WATER], [{ type: CardType.LIGHTNING }], 1]);
    expect(frog.attacks.map(a => [a.cost.length, a.damage])).toEqual([[1, ''], [2, '50']]);
    const froakie = new FroakieCRI();
    expect([froakie.hp, froakie.stage, froakie.cardTypes, froakie.weakness, froakie.retreat.length])
      .toEqual([70, Stage.BASIC, [CardType.WATER], [{ type: CardType.LIGHTNING }], 1]);
    expect(froakie.attacks.map(a => [a.cost, a.damage])).toEqual([[[CardType.COLORLESS], ''],
      [[CardType.WATER], '10']]);
    const starmie = new MegaStarmieEx();
    expect([starmie.hp, starmie.stage, starmie.evolvesFrom, starmie.cardTypes, starmie.weakness,
      starmie.retreat.length, starmie.tags]).toEqual([330, Stage.STAGE_1, 'Staryu', [CardType.WATER],
      [{ type: CardType.LIGHTNING }], 2, [CardTag.POKEMON_EX, CardTag.MEGA_EVOLUTION_EX]]);
    expect(starmie.attacks.map(a => [a.cost.length, a.damage])).toEqual([[1, '120'], [3, '210']]);
    const staryu = new StaryuPOR();
    expect([staryu.hp, staryu.cardTypes, staryu.weakness, staryu.retreat.length, staryu.attacks[0].damage])
      .toEqual([70, [CardType.WATER], [{ type: CardType.LIGHTNING }], 1, '20']);
    expect(new GrandTree().tags).toEqual([CardTag.ACE_SPEC]);
    expect(new GrandTree().trainerType).toEqual(TrainerType.STADIUM);
    expect(new ColresssTenacity().trainerType).toEqual(TrainerType.SUPPORTER);
  });

  it('Collect draws a card', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new FroakieCRI()], [CardType.COLORLESS]);
    const top = player.deck.cards[0];
    sim.dispatch(new AttackAction(1, 'Collect'));
    expect(player.hand.cards).toEqual([top]);
  });

  it('Summoning Jutsu searches for up to 3 Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new FroakieCRI(), new FrogadierCRI()], [CardType.WATER]);
    const a = new StaryuPOR();
    const b = new GreninjaEx();
    player.deck.cards = [new TestCard(), a, b];
    sim.dispatch(new AttackAction(1, 'Summoning Jutsu'));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt.options.max).toEqual(3);
    expect(prompt.filter).toEqual({ superType: a.superType });
    sim.dispatch(new ResolvePromptAction(prompt.id, [a, b]));
    shuffle();
    expect(player.hand.cards).toEqual([a, b]);
    expect(player.deck.cards.length).toEqual(1);
  });

  it('Shinobi Blade does 170 and may search for any card', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new GreninjaEx()], [CardType.WATER]);
    const wanted = player.deck.cards[10];
    sim.dispatch(new AttackAction(1, 'Shinobi Blade'));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect([prompt.options.min, prompt.options.max]).toEqual([0, 1]);
    sim.dispatch(new ResolvePromptAction(prompt.id, [wanted]));
    shuffle();
    expect(player.hand.cards).toEqual([wanted]);
    expect(opponent.active.damage).toEqual(170);
  });

  it('Mirage Barrage discards 2 Energy and does 120 to 2 Pokémon (Weakness only on the Active)', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.active.pokemons.cards = [new WeakToFighting()];
    const benched = new WeakToFighting();
    opponent.bench[0].pokemons.cards = [benched];
    opponent.bench[1].pokemons.cards = [new TestPokemon()];
    TestUtils.setActive(sim, [new GreninjaEx()], [CardType.WATER, CardType.COLORLESS, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Mirage Barrage'));

    const discard = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect([discard.options.min, discard.options.max]).toEqual([2, 2]);
    sim.dispatch(new ResolvePromptAction(discard.id, player.active.energies.cards.slice(0, 2)));
    expect(player.active.energies.cards.length).toEqual(1);
    expect(player.discard.cards.length).toEqual(2);

    const targets = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    expect([targets.options.min, targets.options.max]).toEqual([2, 2]);
    sim.dispatch(new ResolvePromptAction(targets.id, [opponent.active, opponent.bench[0]]));
    expect(opponent.active.damage).toEqual(240);
    expect(opponent.bench[0].damage).toEqual(120);
    expect(opponent.bench[1].damage).toEqual(0);
  });

  it('Mirage Barrage can hit 2 Benched Pokémon and leave the Active alone', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.bench[0].pokemons.cards = [new TestPokemon()];
    opponent.bench[1].pokemons.cards = [new TestPokemon()];
    TestUtils.setActive(sim, [new GreninjaEx()], [CardType.WATER, CardType.COLORLESS, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Mirage Barrage'));
    const discard = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(discard.id, player.active.energies.cards.slice(0, 2)));
    const targets = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(targets.id, [opponent.bench[0], opponent.bench[1]]));
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.bench[0].damage).toEqual(120);
    expect(opponent.bench[1].damage).toEqual(120);
  });

  it('Mirage Barrage hits only the Active when the opponent has no Bench', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new GreninjaEx()], [CardType.WATER, CardType.COLORLESS, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Mirage Barrage'));
    const discard = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(discard.id, player.active.energies.cards.slice(0, 2)));
    const targets = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    expect([targets.options.min, targets.options.max]).toEqual([1, 1]);
    sim.dispatch(new ResolvePromptAction(targets.id, [opponent.active]));
    expect(opponent.active.damage).toEqual(120);
  });

  it('Jetting Blow does 120 and 50 to a Benched Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.bench[0].pokemons.cards = [new WeakToWater()];
    TestUtils.setActive(sim, [new StaryuPOR(), new MegaStarmieEx()], [CardType.WATER]);
    sim.dispatch(new AttackAction(1, 'Jetting Blow'));
    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[0]]));
    expect(opponent.active.damage).toEqual(120);
    expect(opponent.bench[0].damage).toEqual(50);
  });

  it('Nebula Beam does 210, ignoring Weakness and effects on the opponent\'s Active Pokémon', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new StaryuPOR(), new MegaStarmieEx()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]);
    opponent.active.pokemons.cards = [new WeakToWater()];
    sim.dispatch(new AttackAction(1, 'Nebula Beam'));
    expect(opponent.active.damage).toEqual(210);

    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 5;
    const all = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new StaryuPOR(), new MegaStarmieEx()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]);
    all.opponent.active.pokemons.cards = [new Shielded()];
    sim.dispatch(new AttackAction(1, 'Nebula Beam'));
    expect(all.opponent.active.damage).toEqual(210);
  });

  it('Ignition Energy provides C, or CCC on an Evolution Pokémon', () => {
    const { player, state } = TestUtils.getAll(sim);
    const ignition = new IgnitionEnergy();
    player.active.pokemons.cards = [new FroakieCRI()];
    player.active.energies.cards = [ignition];
    let check = new CheckProvidedEnergyEffect(player);
    sim.store.reduceEffect(state, check);
    expect(check.energyMap[0].provides).toEqual([CardType.COLORLESS]);

    player.active.pokemons.cards = [new FroakieCRI(), new FrogadierCRI()];
    check = new CheckProvidedEnergyEffect(player);
    sim.store.reduceEffect(state, check);
    expect(check.energyMap[0].provides).toEqual([CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]);
  });

  it('Ignition Energy pays for Mirage Barrage on Greninja ex and is discarded at the end of the turn', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const ignition = new IgnitionEnergy();
    player.active.pokemons.cards = [new FroakieCRI(), new FrogadierCRI(), new GreninjaEx()];
    player.active.energies.cards = [new TestEnergy(CardType.WATER), ignition];
    player.bench[0].pokemons.cards = [new TestPokemon()];
    const other = new IgnitionEnergy();
    player.bench[0].energies.cards = [other];
    sim.dispatch(new PassTurnAction(1));
    expect(player.discard.cards).toContain(ignition);
    expect(player.discard.cards).toContain(other);
    expect(player.active.energies.cards.length).toEqual(1);
    expect(opponent).toBeDefined();
  });

  it('Bubbly Water Energy keeps a W Pokémon free of Special Conditions', () => {
    const { player, opponent, state } = TestUtils.getAll(sim);
    player.active.pokemons.cards = [new WaterPokemon()];
    player.active.energies.cards = [new BubblyWaterEnergy()];
    const attack = new AttackEffect(opponent, player, opponent.active.getPokemonCard()!.attacks[0]);
    const asleep = new AddSpecialConditionsEffect(attack, [SpecialCondition.ASLEEP]);
    sim.store.reduceEffect(state, asleep);
    expect(player.active.specialConditions).toEqual([]);

    // Recovers from a condition it already had.
    player.active.specialConditions = [SpecialCondition.POISONED];
    sim.store.reduceEffect(state, new CheckProvidedEnergyEffect(player));
    expect(player.active.specialConditions).toEqual([]);
  });

  it('Bubbly Water Energy does not protect a Pokémon that is not W', () => {
    const { player, opponent, state } = TestUtils.getAll(sim);
    player.active.pokemons.cards = [new TestPokemon()];
    player.active.energies.cards = [new BubblyWaterEnergy()];
    const attack = new AttackEffect(opponent, player, opponent.active.getPokemonCard()!.attacks[0]);
    sim.store.reduceEffect(state, new AddSpecialConditionsEffect(attack, [SpecialCondition.ASLEEP]));
    expect(player.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
  });

  it('Grand Tree evolves a Basic into its Stage 1, then its Stage 2, from the deck', () => {
    const { player } = TestUtils.getAll(sim);
    const froakie = new FroakieCRI();
    const frog = new FrogadierCRI();
    const gren = new GreninjaEx();
    const starmie = new MegaStarmieEx();
    player.active.pokemons.cards = [froakie];
    player.active.pokemonPlayedTurn = 3;
    player.deck.cards = [new TestCard(), starmie, frog, gren];
    player.stadium.cards = [new GrandTree()];

    sim.dispatch(new UseStadiumAction(1));
    const stage1 = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    // Only Frogadier evolves from a Basic in play.
    expect(stage1.options.blocked).toEqual([0, 1, 3]);
    sim.dispatch(new ResolvePromptAction(stage1.id, [frog]));
    const target = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(target.id, [player.active]));
    const stage2 = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(stage2.id, [gren]));
    shuffle();

    expect(player.active.pokemons.cards).toEqual([froakie, frog, gren]);
    expect(player.active.pokemonPlayedTurn).toEqual(5);
    expect(player.deck.cards.length).toEqual(2);
    // Once per turn.
    expect(code(() => sim.dispatch(new UseStadiumAction(1)))).toEqual(GameMessage.STADIUM_ALREADY_USED);
  });

  it('Grand Tree can\'t evolve a Basic put into play this turn', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.pokemons.cards = [new FroakieCRI()];
    player.active.pokemonPlayedTurn = 5;
    player.deck.cards = [new FrogadierCRI()];
    player.stadium.cards = [new GrandTree()];
    expect(code(() => sim.dispatch(new UseStadiumAction(1)))).toEqual(GameMessage.CANNOT_USE_STADIUM);
  });

  it('Colress\'s Tenacity searches for a Stadium and an Energy', () => {
    const { player } = TestUtils.getAll(sim);
    const tree = new GrandTree();
    const energy = new IgnitionEnergy();
    player.deck.cards = [new TestCard(), tree, energy];
    player.hand.cards = [new ColresssTenacity()];
    sim.dispatch(new PlayCardAction(1, 0, hand));
    const stadium = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(stadium.id, [tree]));
    const energyPrompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(energyPrompt.id, [energy]));
    shuffle();
    expect(player.hand.cards).toEqual([tree, energy]);
    expect(player.deck.cards.length).toEqual(1);
  });
});
