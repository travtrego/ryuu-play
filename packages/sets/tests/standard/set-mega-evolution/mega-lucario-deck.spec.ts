import {
  AddSpecialConditionsEffect,
  AttachEnergyPrompt,
  AttackAction,
  AttackEffect,
  CardTag,
  CardType,
  CheckHpEffect,
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
  Simulator,
  SlotType,
  SpecialCondition,
  Stage,
  State,
  StoreLike,
  TrainerType,
  UseAbilityAction,
} from '@ptcg/common';

import { MegaLucarioEx } from '../../../src/standard/set-mega-evolution/mega-lucario-ex';
import { RioluMEG } from '../../../src/standard/set-mega-evolution/riolu';
import { SolrockMEG } from '../../../src/standard/set-mega-evolution/solrock';
import { LunatoneMEG } from '../../../src/standard/set-mega-evolution/lunatone';
import { FightingGong } from '../../../src/standard/set-mega-evolution/fighting-gong';
import { PremiumPowerPro } from '../../../src/standard/set-mega-evolution/premium-power-pro';
import { Kadabra } from '../../../src/standard/set-mega-evolution/kadabra';
import { Abra } from '../../../src/standard/set-mega-evolution/abra';
import { RioluPRE } from '../../../src/standard/set-prismatic-evolutions/riolu';
import { DudunsparceEx } from '../../../src/standard/set-journey-together/dudunsparce-ex';
import { DunsparceJTG } from '../../../src/standard/set-journey-together/dunsparce';
import { GravityMountain } from '../../../src/standard/set-surging-sparks/gravity-mountain';
import { LisiasAppeal } from '../../../src/standard/set-surging-sparks/lisias-appeal';
import { LatiasEx } from '../../../src/standard/set-surging-sparks/latias-ex';
import { RockyFightingEnergy } from '../../../src/standard/set-perfect-order/rocky-fighting-energy';
import { FightingEnergy } from '../../../src/standard/set-diamond-and-pearl/fighting-energy';
import { MeganiumMEG } from '../../../src/standard/set-mega-evolution/meganium';
import { BayleefMEG } from '../../../src/standard/set-mega-evolution/bayleef';
import { TestCard } from '../../test-cards/test-card';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class FightingWeak extends TestPokemon {
  public weakness = [{ type: CardType.FIGHTING }];
}

/** Takes 100 less damage from attacks (an effect on the Defending Pokémon). */
class Shielded extends TestPokemon {
  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PutDamageEffect && effect.target.pokemons.cards.includes(this)) {
      effect.damage = Math.max(0, effect.damage - 100);
    }
    return state;
  }
}

class FightingPokemon extends TestPokemon {
  public cardTypes = [CardType.FIGHTING];
}

const hand = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BOARD, index: 0 };

describe('Mega Lucario deck cards', () => {
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

  it('Should have the printed stats', () => {
    const psychic = [{ type: CardType.PSYCHIC }];
    const grass = [{ type: CardType.GRASS }];
    const lucario = new MegaLucarioEx();
    expect([lucario.hp, lucario.stage, lucario.evolvesFrom, lucario.cardTypes, lucario.weakness,
      lucario.retreat.length, lucario.tags]).toEqual([340, Stage.STAGE_1, 'Riolu', [CardType.FIGHTING], psychic, 2,
      [CardTag.POKEMON_EX, CardTag.MEGA_EVOLUTION_EX]]);
    expect(lucario.attacks.map(a => [a.cost.length, a.damage])).toEqual([[1, '130'], [2, '270']]);
    const r1 = new RioluMEG();
    expect([r1.hp, r1.weakness, r1.retreat.length, r1.attacks[0].damage]).toEqual([80, psychic, 2, '30']);
    const r2 = new RioluPRE();
    expect([r2.hp, r2.weakness, r2.retreat.length, r2.attacks[0].damage]).toEqual([70, psychic, 1, '10+']);
    const sol = new SolrockMEG();
    const luna = new LunatoneMEG();
    expect([sol.hp, sol.weakness, sol.retreat.length, luna.hp, luna.weakness, luna.retreat.length])
      .toEqual([110, grass, 1, 110, grass, 1]);
    expect(luna.attacks[0].cost).toEqual([CardType.FIGHTING, CardType.FIGHTING]);
    const dud = new DudunsparceEx();
    expect([dud.hp, dud.stage, dud.evolvesFrom, dud.weakness, dud.retreat.length, dud.tags])
      .toEqual([270, Stage.STAGE_1, 'Dunsparce', [{ type: CardType.FIGHTING }], 3, [CardTag.POKEMON_EX]]);
    expect([new FightingGong().trainerType, new PremiumPowerPro().trainerType, new GravityMountain().trainerType,
      new LisiasAppeal().trainerType]).toEqual([TrainerType.ITEM, TrainerType.ITEM, TrainerType.STADIUM,
      TrainerType.SUPPORTER]);
    expect(new RockyFightingEnergy().provides).toEqual([CardType.FIGHTING]);
  });

  it('Aura Jab does 130 and attaches up to 3 Basic F Energy from the discard pile to Benched Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new RioluMEG(), new MegaLucarioEx()], [CardType.FIGHTING]);
    player.bench[0].pokemons.cards = [new TestPokemon()];
    player.bench[1].pokemons.cards = [new TestPokemon()];
    const [e1, e2] = [new FightingEnergy(), new FightingEnergy()];
    const other = new TestCard();
    player.discard.cards = [other, e1, e2];
    sim.dispatch(new AttackAction(1, 'Aura Jab'));
    const prompt = TestUtils.lastPrompt(sim, player) as AttachEnergyPrompt;
    expect(prompt instanceof AttachEnergyPrompt).toBeTrue();
    expect(prompt.options.blocked).toEqual([0]);
    expect(prompt.options.max).toEqual(3);
    sim.dispatch(new ResolvePromptAction(prompt.id, [
      { to: { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 }, card: e1 },
      { to: { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 1 }, card: e2 },
    ]));
    expect(player.bench[0].energies.cards).toEqual([e1]);
    expect(player.bench[1].energies.cards).toEqual([e2]);
    expect(player.discard.cards).toEqual([other]);
    expect(opponent.active.damage).toEqual(130);
  });

  it('Mega Brave does 270 and can\'t be used during the next turn (Aura Jab can)', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new RioluMEG(), new MegaLucarioEx()], [CardType.FIGHTING, CardType.FIGHTING]);
    sim.dispatch(new AttackAction(1, 'Mega Brave'));
    expect(opponent.active.damage).toEqual(270);
    sim.dispatch(new PassTurnAction(2));
    // Aura Jab is allowed; one turn later Mega Brave is allowed again.
    TestUtils.getAll(sim).opponent.active.damage = 0;
    sim.dispatch(new AttackAction(1, 'Aura Jab'));
    sim.dispatch(new PassTurnAction(2));
    const all = TestUtils.getAll(sim);
    all.opponent.active.damage = 0;
    sim.dispatch(new AttackAction(1, 'Mega Brave'));
    expect(all.opponent.active.damage).toEqual(270);
    sim.dispatch(new PassTurnAction(2));
    expect(code(() => sim.dispatch(new AttackAction(1, 'Mega Brave')))).toEqual(GameMessage.BLOCKED_BY_EFFECT);
  });

  it('Accelerating Stab does 30 and can\'t be used during the next turn', () => {
    TestUtils.setActive(sim, [new RioluMEG()], [CardType.FIGHTING]);
    sim.dispatch(new AttackAction(1, 'Accelerating Stab'));
    expect(TestUtils.getAll(sim).opponent.active.damage).toEqual(30);
    sim.dispatch(new PassTurnAction(2));
    expect(code(() => sim.dispatch(new AttackAction(1, 'Accelerating Stab'))))
      .toEqual(GameMessage.BLOCKED_BY_EFFECT);
  });

  it('Quick Attack does 30 on heads', () => {
    TestUtils.setActive(sim, [new RioluPRE()], [CardType.FIGHTING]);
    sim.dispatch(new AttackAction(1, 'Quick Attack'));
    expect(TestUtils.getAll(sim).opponent.active.damage).toEqual(30);
  });

  it('Cosmic Beam needs Lunatone on the Bench and ignores Weakness', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.active.pokemons.cards = [new FightingWeak()];
    TestUtils.setActive(sim, [new SolrockMEG()], [CardType.FIGHTING]);
    sim.dispatch(new AttackAction(1, 'Cosmic Beam'));
    expect(opponent.active.damage).toEqual(0);

    sim = TestUtils.createTestSimulator();
    const all = TestUtils.getAll(sim);
    all.opponent.active.pokemons.cards = [new FightingWeak()];
    TestUtils.setActive(sim, [new SolrockMEG()], [CardType.FIGHTING]);
    all.player.bench[0].pokemons.cards = [new LunatoneMEG()];
    sim.dispatch(new AttackAction(1, 'Cosmic Beam'));
    expect(all.opponent.active.damage).toEqual(70);
  });

  it('Lunar Cycle: with Solrock in play, discard a Basic F Energy to draw 3, once a turn for all Lunatone', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.pokemons.cards = [new SolrockMEG()];
    player.bench[0].pokemons.cards = [new LunatoneMEG()];
    player.bench[1].pokemons.cards = [new LunatoneMEG()];
    const energy = new FightingEnergy();
    const keep = new TestCard();
    player.hand.cards = [keep, energy, new FightingEnergy()];
    sim.dispatch(new UseAbilityAction(1, 'Lunar Cycle', TestUtils.target(sim, player.bench[0])));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt.options.blocked).toEqual([0]);
    sim.dispatch(new ResolvePromptAction(prompt.id, [energy]));
    expect(player.discard.cards).toEqual([energy]);
    expect(player.hand.cards.length).toEqual(5);
    expect(code(() => sim.dispatch(new UseAbilityAction(1, 'Lunar Cycle',
      TestUtils.target(sim, TestUtils.getAll(sim).player.bench[1]))))).toEqual(GameMessage.POWER_ALREADY_USED);
  });

  it('Lunar Cycle needs Solrock in play and a Basic F Energy in the hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0].pokemons.cards = [new LunatoneMEG()];
    player.hand.cards = [new FightingEnergy()];
    expect(code(() => sim.dispatch(new UseAbilityAction(1, 'Lunar Cycle', TestUtils.target(sim, player.bench[0])))))
      .toEqual(GameMessage.CANNOT_USE_POWER);
    const all = TestUtils.getAll(sim);
    all.player.bench[1].pokemons.cards = [new SolrockMEG()];
    all.player.hand.cards = [new TestCard()];
    expect(code(() => sim.dispatch(new UseAbilityAction(1, 'Lunar Cycle',
      TestUtils.target(sim, all.player.bench[0]))))).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  it('Tenacious Tail does 60 for each of the opponent\'s Pokémon ex in play', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.active.pokemons.cards = [new LatiasEx()];
    opponent.bench[0].pokemons.cards = [new LatiasEx()];
    opponent.bench[1].pokemons.cards = [new TestPokemon()];
    TestUtils.setActive(sim, [new DunsparceJTG(), new DudunsparceEx()], [CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Tenacious Tail'));
    expect(opponent.active.damage).toEqual(120);
  });

  it('Destructive Drill ignores effects on the opponent\'s Active Pokémon', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.active.pokemons.cards = [new Shielded()];
    TestUtils.setActive(sim, [new DunsparceJTG(), new DudunsparceEx()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Destructive Drill'));
    expect(opponent.active.damage).toEqual(150);
  });

  it('Fighting Gong finds a Basic F Energy or Basic F Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const riolu = new RioluMEG();
    player.deck.cards = [new Abra(), new FightingEnergy(), new TestCard(), riolu, new MegaLucarioEx()];
    player.hand.cards = [new FightingGong()];
    sim.dispatch(new PlayCardAction(1, 0, hand));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt.options.blocked).toEqual([0, 2, 4]);
    sim.dispatch(new ResolvePromptAction(prompt.id, [riolu]));
    const show = TestUtils.lastPrompt(sim, opponent);
    if (show instanceof ShowCardsPrompt && show.result === undefined) {
      sim.dispatch(new ResolvePromptAction(show.id, true));
    }
    expect(player.hand.cards).toEqual([riolu]);
    expect(player.deck.cards.length).toEqual(4);
  });

  it('Premium Power Pro: F Pokémon do 30 more to the Active this turn; copies add up', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new RioluMEG()], [CardType.FIGHTING]);
    player.hand.cards = [new PremiumPowerPro(), new PremiumPowerPro()];
    sim.dispatch(new PlayCardAction(1, 0, hand));
    sim.dispatch(new PlayCardAction(1, 0, hand));
    sim.dispatch(new AttackAction(1, 'Accelerating Stab'));
    expect(opponent.active.damage).toEqual(90);

    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 5;
    const all = TestUtils.getAll(sim);
    all.player.hand.cards = [new PremiumPowerPro()];
    sim.dispatch(new PlayCardAction(1, 0, hand));
    sim.dispatch(new AttackAction(1, 'Test attack'));
    expect(all.opponent.active.damage).toEqual(10);
  });

  it('Premium Power Pro ends with the turn', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new FightingPokemon()], []);
    player.hand.cards = [new PremiumPowerPro()];
    sim.dispatch(new PlayCardAction(1, 0, hand));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new PassTurnAction(2));
    const all = TestUtils.getAll(sim);
    sim.dispatch(new AttackAction(1, 'Test attack'));
    expect(all.opponent.active.damage).toEqual(10);
  });

  it('Gravity Mountain gives each Stage 2 Pokémon in play -30 HP', () => {
    const { player, opponent, state } = TestUtils.getAll(sim);
    opponent.stadium.cards = [new GravityMountain()];
    player.active.pokemons.cards = [new MeganiumMEG()];
    player.bench[0].pokemons.cards = [new BayleefMEG()];
    const hp = (slot = player.active) => {
      const check = new CheckHpEffect(player, slot);
      sim.store.reduceEffect(state, check);
      return check.hp;
    };
    expect(hp()).toEqual(130);
    expect(hp(player.bench[0])).toEqual(110);
    opponent.stadium.cards = [];
    expect(hp()).toEqual(160);
  });

  it('Lisia\'s Appeal brings up a Benched Basic Pokémon and Confuses it', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const basic = new TestPokemon();
    opponent.bench[0].pokemons.cards = [new Abra(), new Kadabra()];
    opponent.bench[2].pokemons.cards = [basic];
    player.hand.cards = [new LisiasAppeal()];
    sim.dispatch(new PlayCardAction(1, 0, hand));
    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    expect(prompt.options.blocked.map(t => t.index)).toEqual([0, 1, 3, 4]);
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[2]]));
    expect(opponent.active.getPokemonCard()).toBe(basic);
    expect(opponent.active.specialConditions).toContain(SpecialCondition.CONFUSED);
  });

  it('Lisia\'s Appeal can\'t be played without an opponent\'s Benched Basic Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.bench[0].pokemons.cards = [new Abra(), new Kadabra()];
    player.hand.cards = [new LisiasAppeal()];
    expect(code(() => sim.dispatch(new PlayCardAction(1, 0, hand)))).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });

  it('Rocky Fighting Energy prevents effects of the opponent\'s attacks on a F Pokémon only', () => {
    const { player, opponent, state } = TestUtils.getAll(sim);
    const confuse = () => {
      const attack = new AttackEffect(opponent, player, opponent.active.getPokemonCard()!.attacks[0]);
      const effect = new AddSpecialConditionsEffect(attack, [SpecialCondition.CONFUSED]);
      sim.store.reduceEffect(state, effect);
      return player.active.specialConditions.includes(SpecialCondition.CONFUSED);
    };
    player.active.pokemons.cards = [new RioluMEG()];
    player.active.energies.cards = [new RockyFightingEnergy()];
    expect(confuse()).toBeFalse();
    player.active.pokemons.cards = [new TestPokemon()];
    expect(confuse()).toBeTrue();
  });
});
