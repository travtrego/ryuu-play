import {
  AttachEnergyPrompt,
  AttackAction,
  CardTag,
  CardType,
  CheckProvidedEnergyEffect,
  ChooseCardsPrompt,
  ChoosePokemonPrompt,
  Effect,
  GameError,
  GameMessage,
  GamePhase,
  KnockOutEffect,
  PlayCardAction,
  PlayerType,
  PowerEffect,
  PowerType,
  ResolvePromptAction,
  ShowCardsPrompt,
  Simulator,
  SlotType,
  Stage,
  State,
  StateUtils,
  StoreLike,
  TrainerType,
  UseAbilityAction,
} from '@ptcg/common';

import { ChikoritaASC } from '../../../src/standard/set-ascended-heroes/chikorita';
import { BayleefMEG } from '../../../src/standard/set-mega-evolution/bayleef';
import { MeganiumMEG } from '../../../src/standard/set-mega-evolution/meganium';
import { CelebiMEG } from '../../../src/standard/set-mega-evolution/celebi';
import { ForestOfVitality } from '../../../src/standard/set-mega-evolution/forest-of-vitality';
import { Abra } from '../../../src/standard/set-mega-evolution/abra';
import { Kadabra } from '../../../src/standard/set-mega-evolution/kadabra';
import { HydrappleEx } from '../../../src/standard/set-stellar-crown/hydrapple-ex';
import { Briar } from '../../../src/standard/set-stellar-crown/briar';
import { TapuBulu } from '../../../src/standard/set-shrouded-fable/tapu-bulu';
import { TealMaskOgerponEx } from '../../../src/standard/set-twilight-masquerade/teal-mask-ogerpon-ex';
import { Applin } from '../../../src/standard/set-twilight-masquerade/applin';
import { Dipplin } from '../../../src/standard/set-twilight-masquerade/dipplin';
import { GrassEnergy } from '../../../src/standard/set-diamond-and-pearl/grass-energy';
import { TestCard } from '../../test-cards/test-card';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

/** Turns off the opponent's Abilities (stand-in for an Ability lock). */
class AbilityLock extends TestPokemon {
  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect && effect.power.powerType === PowerType.ABILITY
      && StateUtils.findOwner(state, StateUtils.findPokemonSlot(state, this)!) !== effect.player) {
      throw new GameError(GameMessage.BLOCKED_BY_ABILITY);
    }
    return state;
  }
}

/** An attacker for the opponent that does 50 damage. */
class Hitter extends TestPokemon {
  public attacks = [{ name: 'Hit', cost: [], damage: '50', text: '' }];
}

function grass(count: number): GrassEnergy[] {
  return Array.from({ length: count }, () => new GrassEnergy());
}

describe('Ogerpon Meganium Hydrapple deck cards', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 5;
  });

  function meganiumOnBench(index = 0) {
    const { player } = TestUtils.getAll(sim);
    player.bench[index].pokemons.cards = [new ChikoritaASC(), new BayleefMEG(), new MeganiumMEG()];
  }

  function provided(slotOwnerIndex: number, slot: 'active' | number): number[] {
    const { state } = TestUtils.getAll(sim);
    const owner = state.players[slotOwnerIndex];
    const target = slot === 'active' ? owner.active : owner.bench[slot];
    const check = new CheckProvidedEnergyEffect(owner, target);
    sim.store.reduceEffect(state, check);
    return check.energyMap.map(e => e.provideAmount);
  }

  it('Should have the printed stats', () => {
    const fire = [{ type: CardType.FIRE }];
    const chikorita = new ChikoritaASC();
    expect([chikorita.hp, chikorita.stage, chikorita.cardTypes, chikorita.weakness, chikorita.retreat.length])
      .toEqual([70, Stage.BASIC, [CardType.GRASS], fire, 1]);
    expect(chikorita.attacks.map(a => [a.name, a.cost, a.damage])).toEqual([
      ['Growl', [CardType.COLORLESS], ''], ['Seed Bomb', [CardType.GRASS, CardType.GRASS], '30']]);
    const bayleef = new BayleefMEG();
    expect([bayleef.hp, bayleef.stage, bayleef.evolvesFrom, bayleef.weakness, bayleef.retreat.length,
      bayleef.attacks[0].cost]).toEqual([110, Stage.STAGE_1, 'Chikorita', fire, 2,
      [CardType.GRASS, CardType.COLORLESS]]);
    const meganium = new MeganiumMEG();
    expect([meganium.hp, meganium.stage, meganium.evolvesFrom, meganium.weakness, meganium.retreat.length,
      meganium.powers[0].name, meganium.attacks[0].damage, meganium.attacks[0].cost.length])
      .toEqual([160, Stage.STAGE_2, 'Bayleef', fire, 2, 'Wild Growth', '140', 4]);
    const celebi = new CelebiMEG();
    expect([celebi.hp, celebi.stage, celebi.weakness, celebi.retreat.length, celebi.attacks.length])
      .toEqual([80, Stage.BASIC, fire, 1, 2]);
    const hydrapple = new HydrappleEx();
    expect([hydrapple.hp, hydrapple.stage, hydrapple.evolvesFrom, hydrapple.weakness, hydrapple.retreat.length,
      hydrapple.tags, hydrapple.attacks[0].cost]).toEqual([330, Stage.STAGE_2, 'Dipplin', fire, 3,
      [CardTag.POKEMON_EX], [CardType.COLORLESS, CardType.COLORLESS]]);
    const bulu = new TapuBulu();
    expect([bulu.hp, bulu.stage, bulu.weakness, bulu.retreat.length, bulu.attacks[0].damage])
      .toEqual([140, Stage.BASIC, fire, 3, '220']);
    expect(new Briar().trainerType).toEqual(TrainerType.SUPPORTER);
    expect(new ForestOfVitality().trainerType).toEqual(TrainerType.STADIUM);
  });

  it('Growl: the Defending Pokémon\'s attacks do 20 less damage during the opponent\'s next turn', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new ChikoritaASC()], [CardType.GRASS]);
    opponent.active.pokemons.cards = [new Hitter()];
    sim.dispatch(new AttackAction(1, 'Growl'));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    sim.dispatch(new AttackAction(2, 'Hit'));
    expect(player.active.damage).toEqual(30);
  });

  it('Seed Bomb does 30', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new ChikoritaASC()], [CardType.GRASS, CardType.GRASS]);
    sim.dispatch(new AttackAction(1, 'Seed Bomb'));
    expect(opponent.active.damage).toEqual(30);
  });

  it('Push Down does 50, then the opponent chooses a new Active Pokémon', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new ChikoritaASC(), new BayleefMEG()], [CardType.GRASS, CardType.GRASS]);
    const old = opponent.active.getPokemonCard();
    const benched = new TestPokemon();
    opponent.bench[1].pokemons.cards = [benched];
    sim.dispatch(new AttackAction(1, 'Push Down'));
    const prompt = TestUtils.lastPrompt(sim, opponent) as ChoosePokemonPrompt;
    expect(prompt instanceof ChoosePokemonPrompt).toBeTrue();
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[1]]));
    expect(opponent.active.getPokemonCard()).toBe(benched);
    expect(opponent.bench[1].getPokemonCard()).toBe(old);
    expect(opponent.bench[1].damage).toEqual(50);
  });

  it('Push Down with no opponent\'s Benched Pokémon only does damage', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new ChikoritaASC(), new BayleefMEG()], [CardType.GRASS, CardType.GRASS]);
    sim.dispatch(new AttackAction(1, 'Push Down'));
    expect(opponent.active.damage).toEqual(50);
  });

  it('Wild Growth: each Basic G Energy on its owner\'s Pokémon provides GG', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.energies.cards = [...grass(2), ...TestUtils.makeEnergies([CardType.FIRE])];
    opponent.active.energies.cards = grass(1);
    expect(provided(0, 'active')).toEqual([1, 1, 1]);
    meganiumOnBench(0);
    meganiumOnBench(1); // doesn't stack
    expect(provided(0, 'active')).toEqual([2, 2, 1]);
    expect(provided(1, 'active')).toEqual([1]);
  });

  it('Wild Growth does nothing while Abilities are blocked, or from Bayleef', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.energies.cards = grass(1);
    player.bench[0].pokemons.cards = [new ChikoritaASC(), new BayleefMEG()];
    player.hand.cards = [new MeganiumMEG()];
    expect(provided(0, 'active')).toEqual([1]);
    meganiumOnBench(1);
    opponent.bench[0].pokemons.cards = [new AbilityLock()];
    expect(provided(0, 'active')).toEqual([1]);
  });

  it('Wild Growth lets GG pay for a GG cost from one Basic G Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new ChikoritaASC()], []);
    TestUtils.getAll(sim).player.active.energies.cards = grass(1);
    meganiumOnBench(0);
    sim.dispatch(new AttackAction(1, 'Seed Bomb'));
    expect(opponent.active.damage).toEqual(30);
  });

  it('Myriad Leaf Shower counts what the Energy provides (Wild Growth doubles Basic G)', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TealMaskOgerponEx()], []);
    player.active.energies.cards = grass(3);
    sim.dispatch(new AttackAction(1, 'Myriad Leaf Shower'));
    expect(opponent.active.damage).toEqual(120);

    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 5;
    const all = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TealMaskOgerponEx()], []);
    all.player.active.energies.cards = grass(3);
    meganiumOnBench(0);
    sim.dispatch(new AttackAction(1, 'Myriad Leaf Shower'));
    expect(all.opponent.active.damage).toEqual(210);
  });

  it('Syrup Storm does 30 more for each G Energy on all of its owner\'s Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Applin(), new Dipplin(), new HydrappleEx()], []);
    player.active.energies.cards = grass(2);
    player.bench[2].pokemons.cards = [new TealMaskOgerponEx()];
    player.bench[2].energies.cards = [...grass(2), ...TestUtils.makeEnergies([CardType.FIRE])];
    opponent.active.energies.cards = grass(2);
    sim.dispatch(new AttackAction(1, 'Syrup Storm'));
    expect(opponent.active.damage).toEqual(150);

    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 5;
    const all = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Applin(), new Dipplin(), new HydrappleEx()], []);
    all.player.active.energies.cards = grass(1); // GG under Wild Growth pays for CC
    all.player.bench[2].pokemons.cards = [new TealMaskOgerponEx()];
    all.player.bench[2].energies.cards = grass(2);
    meganiumOnBench(0);
    sim.dispatch(new AttackAction(1, 'Syrup Storm'));
    expect(all.opponent.active.damage).toEqual(210);
  });

  it('Ripening Charge attaches a Basic G Energy from the hand and heals 30 from that Pokémon, once a turn', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.pokemons.cards = [new Applin(), new Dipplin(), new HydrappleEx()];
    player.bench[0].pokemons.cards = [new TestPokemon()];
    player.bench[0].damage = 40;
    const energy = new GrassEnergy();
    const other = new TestCard();
    player.hand.cards = [other, energy];
    sim.dispatch(new UseAbilityAction(1, 'Ripening Charge', TestUtils.target(sim, player.active)));
    const prompt = TestUtils.lastPrompt(sim, player) as AttachEnergyPrompt;
    expect(prompt instanceof AttachEnergyPrompt).toBeTrue();
    expect(prompt.options.blocked).toEqual([0]);
    sim.dispatch(new ResolvePromptAction(prompt.id, [
      { to: { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 }, card: energy },
    ]));
    expect(player.bench[0].energies.cards).toEqual([energy]);
    expect(player.bench[0].damage).toEqual(10);
    expect(player.hand.cards).toEqual([other]);

    player.hand.cards = [new GrassEnergy()];
    expect(() => sim.dispatch(new UseAbilityAction(1, 'Ripening Charge', TestUtils.target(sim, player.active))))
      .toThrowMatching((e: GameError) => e.message === GameMessage.POWER_ALREADY_USED);
  });

  it('Ripening Charge needs a Basic G Energy in the hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.pokemons.cards = [new Applin(), new Dipplin(), new HydrappleEx()];
    player.hand.cards = TestUtils.makeEnergies([CardType.FIRE]);
    expect(() => sim.dispatch(new UseAbilityAction(1, 'Ripening Charge', TestUtils.target(sim, player.active))))
      .toThrowMatching((e: GameError) => e.message === GameMessage.CANNOT_USE_POWER);
  });

  it('Wood Hammer does 220 and 30 to Tapu Bulu itself', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TapuBulu()], [CardType.GRASS, CardType.GRASS, CardType.GRASS, CardType.GRASS]);
    sim.dispatch(new AttackAction(1, 'Wood Hammer'));
    expect(opponent.active.damage).toEqual(220);
    expect(player.active.damage).toEqual(30);
  });

  it('Traverse Time finds up to 3 G Pokémon and Stadium cards', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new CelebiMEG()], [CardType.GRASS]);
    const chikorita = new ChikoritaASC();
    const forest = new ForestOfVitality();
    const kadabra = new Kadabra();
    const filler = new TestCard();
    player.deck.cards = [kadabra, chikorita, filler, forest];
    sim.dispatch(new AttackAction(1, 'Traverse Time'));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt instanceof ChooseCardsPrompt).toBeTrue();
    expect(prompt.options.blocked).toEqual([0, 2]);
    expect(prompt.options.max).toEqual(3);
    sim.dispatch(new ResolvePromptAction(prompt.id, [chikorita, forest]));
    const show = TestUtils.lastPrompt(sim, opponent) as ShowCardsPrompt;
    if (show instanceof ShowCardsPrompt && show.result === undefined) {
      sim.dispatch(new ResolvePromptAction(show.id, true));
    }
    expect(player.hand.cards).toEqual([chikorita, forest]);
    expect(player.deck.cards.length).toEqual(2);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Solar Cutter does 30', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new CelebiMEG()], [CardType.GRASS]);
    sim.dispatch(new AttackAction(1, 'Solar Cutter'));
    expect(opponent.active.damage).toEqual(30);
  });

  it('Forest of Vitality lets a G Pokémon played this turn evolve, even twice', () => {
    const { player } = TestUtils.getAll(sim);
    player.stadium.cards = [new ForestOfVitality()];
    player.bench[0].pokemons.cards = [new ChikoritaASC()];
    player.bench[0].pokemonPlayedTurn = 5;
    player.hand.cards = [new BayleefMEG(), new MeganiumMEG()];
    const target = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 };
    sim.dispatch(new PlayCardAction(1, 0, target));
    expect(player.bench[0].getPokemonCard() instanceof BayleefMEG).toBeTrue();
    sim.dispatch(new PlayCardAction(1, 0, target));
    expect(player.bench[0].getPokemonCard() instanceof MeganiumMEG).toBeTrue();
  });

  it('Forest of Vitality: not on a player\'s first turn, not without it, not for other types', () => {
    const target = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 };
    // A failed action restores the state, so each case starts from a new simulator.
    const tryEvolve = (forest: 'none' | 'mine' | 'theirs', turn: number, grassLine: boolean) => {
      sim = TestUtils.createTestSimulator();
      sim.store.state.turn = turn;
      const { player, opponent } = TestUtils.getAll(sim);
      if (forest === 'mine') {
        player.stadium.cards = [new ForestOfVitality()];
      } else if (forest === 'theirs') {
        opponent.stadium.cards = [new ForestOfVitality()];
      }
      player.bench[0].pokemons.cards = [grassLine ? new ChikoritaASC() : new Abra()];
      player.bench[0].pokemonPlayedTurn = turn;
      player.hand.cards = [grassLine ? new BayleefMEG() : new Kadabra()];
      try {
        sim.dispatch(new PlayCardAction(1, 0, target));
      } catch (e) {
        return (e as GameError).message;
      }
      return 'evolved';
    };
    expect(tryEvolve('theirs', 5, true)).toEqual('evolved');
    expect(tryEvolve('none', 5, true)).toEqual(GameMessage.POKEMON_CANT_EVOLVE_THIS_TURN);
    expect(tryEvolve('mine', 5, false)).toEqual(GameMessage.POKEMON_CANT_EVOLVE_THIS_TURN);
    expect(tryEvolve('mine', 2, true)).toEqual(GameMessage.POKEMON_CANT_EVOLVE_THIS_TURN);
    expect(tryEvolve('mine', 1, true)).toEqual(GameMessage.POKEMON_CANT_EVOLVE_THIS_TURN);
  });

  it('Briar can be played only when the opponent has exactly 2 Prize cards left', () => {
    const target = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BOARD, index: 0 };
    let all = TestUtils.getAll(sim);
    all.player.hand.cards = [new Briar()];
    expect(() => sim.dispatch(new PlayCardAction(1, 0, target)))
      .toThrowMatching((e: GameError) => e.message === GameMessage.CANNOT_PLAY_THIS_CARD);
    all = TestUtils.getAll(sim);
    all.opponent.prizes.slice(2).forEach(p => p.cards = []);
    sim.dispatch(new PlayCardAction(1, 0, target));
    expect(all.player.supporter.cards.length).toEqual(1);
    expect(all.player.hand.cards.length).toEqual(0);
  });

  it('Briar: a Tera Pokémon\'s attack that Knocks Out the opponent\'s Active takes 1 more Prize card', () => {
    const { state, player, opponent } = TestUtils.getAll(sim);
    state.phase = GamePhase.ATTACK;
    state.activePlayer = 0;
    player.supporter.cards = [new Briar()];
    const knockOut = () => {
      const ko = new KnockOutEffect(opponent, opponent.active);
      sim.store.reduceEffect(state, ko);
      return ko.prizeCount;
    };
    player.active.pokemons.cards = [new TapuBulu()];
    opponent.active.pokemons.cards = [new TestPokemon()];
    expect(knockOut()).toEqual(1);
    player.active.pokemons.cards = [new TealMaskOgerponEx()];
    opponent.active.pokemons.cards = [new TestPokemon()];
    expect(knockOut()).toEqual(2);

    // Not for a Benched Pokémon, and not outside the attack.
    opponent.bench[0].pokemons.cards = [new TestPokemon()];
    const bench = new KnockOutEffect(opponent, opponent.bench[0]);
    sim.store.reduceEffect(state, bench);
    expect(bench.prizeCount).toEqual(1);
    state.phase = GamePhase.PLAYER_TURN;
    opponent.active.pokemons.cards = [new TestPokemon()];
    expect(knockOut()).toEqual(1);
  });
});
