import {
  AttackAction,
  CardTag,
  CardType,
  ChooseAttackPrompt,
  ChooseCardsPrompt,
  ChoosePokemonPrompt,
  KnockOutEffect,
  OrderCardsPrompt,
  PlayCardAction,
  ResolvePromptAction,
  RetreatAction,
  Simulator,
  SpecialCondition,
  Stage,
  UseAbilityAction,
  UseStadiumAction,
} from '@ptcg/common';

import { Slowpoke } from '../../../src/standard/set-stellar-crown/slowpoke';
import { Slowking } from '../../../src/standard/set-stellar-crown/slowking';
import { MegaKangaskhanEx } from '../../../src/standard/set-mega-evolution/mega-kangaskhan-ex';
import { Kyurem } from '../../../src/standard/set-shrouded-fable/kyurem';
import { AcademyAtNight } from '../../../src/standard/set-shrouded-fable/academy-at-night';
import { LatiasEx } from '../../../src/standard/set-surging-sparks/latias-ex';
import { Annihilape } from '../../../src/standard/set-pitch-black/annihilape';
import { Drapion } from '../../../src/standard/set-perfect-order/drapion';
import { ZeraoraDRI } from '../../../src/standard/set-destined-rivals/zeraora';
import { MewEx30C } from '../../../src/standard/set-30th-celebration/mew-ex';
import { CiphermaniacsCodebreaking } from '../../../src/standard/set-temporal-forces/ciphermaniacs-codebreaking';
import { BoomerangEnergy } from '../../../src/standard/set-twilight-masquerade/boomerang-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class TestEx extends TestPokemon {
  public tags = [CardTag.POKEMON_EX];
  public name = 'Test ex';
  public fullName = 'Test ex TEST';
}

class ColressCard extends TestPokemon {
  public name = 'Colress\'s Experiment';
  public fullName = 'Colress\'s Experiment TEST';
}

class TestStage1 extends TestPokemon {
  public stage = Stage.STAGE_1;
  public retreat = [CardType.COLORLESS, CardType.COLORLESS];
}

describe('Slowking deck cards', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  it('Should have the printed stats', () => {
    const dark = [{ type: CardType.DARK }];
    const fighting30 = [{ type: CardType.FIGHTING, value: -30 }];

    const slowpoke = new Slowpoke();
    expect([slowpoke.hp, slowpoke.stage, slowpoke.cardTypes, slowpoke.retreat.length])
      .toEqual([80, Stage.BASIC, [CardType.PSYCHIC], 2]);
    expect([slowpoke.weakness, slowpoke.resistance]).toEqual([dark, fighting30]);

    const slowking = new Slowking();
    expect([slowking.hp, slowking.stage, slowking.evolvesFrom, slowking.retreat.length])
      .toEqual([120, Stage.STAGE_1, 'Slowpoke', 3]);
    expect([slowking.weakness, slowking.resistance]).toEqual([dark, fighting30]);

    const kangaskhan = new MegaKangaskhanEx();
    expect([kangaskhan.hp, kangaskhan.stage, kangaskhan.cardTypes, kangaskhan.retreat.length])
      .toEqual([300, Stage.BASIC, [CardType.COLORLESS], 3]);
    expect(kangaskhan.weakness).toEqual([{ type: CardType.FIGHTING }]);
    expect(kangaskhan.tags).toEqual([CardTag.POKEMON_EX, CardTag.MEGA_EVOLUTION_EX]);

    const kyurem = new Kyurem();
    expect([kyurem.hp, kyurem.cardTypes, kyurem.weakness, kyurem.retreat.length])
      .toEqual([130, [CardType.DRAGON], [], 2]);

    const latias = new LatiasEx();
    expect([latias.hp, latias.stage, latias.retreat.length, latias.tags]).toEqual([210, Stage.BASIC, 2, [CardTag.POKEMON_EX]]);
    expect([latias.weakness, latias.resistance]).toEqual([dark, fighting30]);

    const annihilape = new Annihilape();
    expect([annihilape.hp, annihilape.stage, annihilape.evolvesFrom, annihilape.retreat.length])
      .toEqual([150, Stage.STAGE_2, 'Primeape', 2]);
    expect([annihilape.weakness, annihilape.resistance]).toEqual([dark, fighting30]);

    const drapion = new Drapion();
    expect([drapion.hp, drapion.stage, drapion.evolvesFrom, drapion.cardTypes, drapion.retreat.length])
      .toEqual([140, Stage.STAGE_1, 'Skorupi', [CardType.DARK], 3]);
    expect(drapion.weakness).toEqual([{ type: CardType.FIGHTING }]);

    const zeraora = new ZeraoraDRI();
    expect([zeraora.hp, zeraora.cardTypes, zeraora.retreat.length]).toEqual([100, [CardType.LIGHTNING], 1]);
    expect(zeraora.weakness).toEqual([{ type: CardType.FIGHTING }]);

    const mew = new MewEx30C();
    expect([mew.hp, mew.retreat.length, mew.tags]).toEqual([160, 0, [CardTag.POKEMON_EX]]);
    expect([mew.weakness, mew.resistance]).toEqual([dark, fighting30]);

    expect(new BoomerangEnergy().provides).toEqual([CardType.COLORLESS]);
  });

  it('Seek Inspiration discards the top card and uses an attack of a Pokémon without a Rule Box', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const drapion = new Drapion();
    player.deck.cards = [drapion, ...TestUtils.makeTestCards(5)];
    TestUtils.setActive(sim, [new Slowpoke(), new Slowking()], [CardType.PSYCHIC, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Seek Inspiration'));
    expect(player.discard.cards).toEqual([drapion]);
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseAttackPrompt;
    expect(prompt instanceof ChooseAttackPrompt).toBeTrue();
    sim.dispatch(new ResolvePromptAction(prompt.id, drapion.attacks[1]));
    // 100, then 10 more from Poison between turns.
    expect(opponent.active.damage).toEqual(110);
    expect(player.active.damage).toEqual(70);
    expect(opponent.active.specialConditions).toContain(SpecialCondition.PARALYZED);
    expect(opponent.active.specialConditions).toContain(SpecialCondition.POISONED);
  });

  it('Seek Inspiration does nothing when the top card has a Rule Box or is not a Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const latias = new LatiasEx();
    player.deck.cards = [latias, ...TestUtils.makeTestCards(5)];
    TestUtils.setActive(sim, [new Slowpoke(), new Slowking()], [CardType.PSYCHIC, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Seek Inspiration'));
    expect(player.discard.cards).toEqual([latias]);
    expect(sim.store.state.prompts.filter(p => p.result === undefined).length).toEqual(0);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Seek Inspiration into Kyurem uses Trifrost, and Boomerang Energy comes back', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const kyurem = new Kyurem();
    player.deck.cards = [kyurem, ...TestUtils.makeTestCards(5)];
    opponent.bench[0].pokemons.cards = [new TestPokemon()];
    opponent.bench[1].pokemons.cards = [new TestPokemon()];
    const boomerang = new BoomerangEnergy();
    TestUtils.setActive(sim, [new Slowpoke(), new Slowking()], [CardType.PSYCHIC]);
    player.active.energies.cards.push(boomerang);
    sim.dispatch(new AttackAction(1, 'Seek Inspiration'));
    const choose = TestUtils.lastPrompt(sim, player) as ChooseAttackPrompt;
    sim.dispatch(new ResolvePromptAction(choose.id, kyurem.attacks[0]));
    const targets = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    expect(targets.options.min).toEqual(3);
    sim.dispatch(new ResolvePromptAction(targets.id, [opponent.active, opponent.bench[0], opponent.bench[1]]));
    expect(opponent.active.damage).toEqual(110);
    expect(opponent.bench[0].damage).toEqual(110);
    expect(opponent.bench[1].damage).toEqual(110);
    // The Psychic Energy stays discarded, Boomerang Energy is attached again.
    expect(player.active.energies.cards).toEqual([boomerang]);
    expect(player.discard.cards.filter(c => c !== kyurem).length).toEqual(1);
  });

  it('Kyurem Plasma Bane makes Trifrost cost C with a Colress card in the opponent\'s discard pile', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Kyurem()], [CardType.COLORLESS]);
    const sim2 = TestUtils.createTestSimulator();
    TestUtils.setActive(sim2, [new Kyurem()], [CardType.COLORLESS]);
    expect(() => sim2.dispatch(new AttackAction(1, 'Trifrost'))).toThrow();

    opponent.discard.cards = [new ColressCard()];
    sim.dispatch(new AttackAction(1, 'Trifrost'));
    // Only the Active Pokémon: Trifrost hits it alone.
    const prompt = TestUtils.lastPrompt(sim) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.active]));
    expect(opponent.active.damage).toEqual(110);
  });

  it('Slowpoke Dangle Tail puts a Pokémon from the discard pile into the hand', () => {
    const { player } = TestUtils.getAll(sim);
    const drapion = new Drapion();
    player.discard.cards = [new BoomerangEnergy(), drapion];
    TestUtils.setActive(sim, [new Slowpoke()], [CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Dangle Tail'));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [drapion]));
    expect(player.hand.cards).toContain(drapion);
  });

  it('Mega Kangaskhan ex Run Errand draws 2, once a turn for all of them, only from the Active Spot', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0].pokemons.cards = [new MegaKangaskhanEx()];
    TestUtils.setActive(sim, [new MegaKangaskhanEx()]);
    sim.dispatch(new UseAbilityAction(1, 'Run Errand', TestUtils.target(sim, player.active)));
    expect(player.hand.cards.length).toEqual(2);
    // Not again this turn, not even from another Mega Kangaskhan ex.
    expect(() => sim.dispatch(new UseAbilityAction(1, 'Run Errand', TestUtils.target(sim, player.active))))
      .toThrow();

    const sim2 = TestUtils.createTestSimulator();
    const p2 = TestUtils.getAll(sim2).player;
    p2.bench[0].pokemons.cards = [new MegaKangaskhanEx()];
    expect(() => sim2.dispatch(new UseAbilityAction(1, 'Run Errand', TestUtils.target(sim2, p2.bench[0]))))
      .toThrow();
  });

  it('Mega Kangaskhan ex Rapid-Fire Combo adds 50 per heads, and gives 3 Prize cards', () => {
    const { state, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true, false]);
    TestUtils.setActive(sim, [new MegaKangaskhanEx()], [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Rapid-Fire Combo'));
    expect(opponent.active.damage).toEqual(300);

    TestUtils.setDefending(sim, [new MegaKangaskhanEx()]);
    const ko = new KnockOutEffect(opponent, opponent.active);
    sim.store.reduceEffect(state, ko);
    expect(ko.prizeCount).toEqual(3);
  });

  it('Latias ex Skyliner removes the Retreat Cost of Basic Pokémon only', () => {
    const { state, player } = TestUtils.getAll(sim);
    state.turn = 2;
    const basic = new TestPokemon();
    basic.retreat = [CardType.COLORLESS, CardType.COLORLESS];
    player.bench[0].pokemons.cards = [new LatiasEx()];
    player.bench[1].pokemons.cards = [new TestPokemon()];
    TestUtils.setActive(sim, [basic]);
    sim.dispatch(new RetreatAction(1, 1));
    expect(player.active.getPokemonCard()).not.toBe(basic);

    const sim2 = TestUtils.createTestSimulator();
    const p2 = TestUtils.getAll(sim2).player;
    TestUtils.getAll(sim2).state.turn = 2;
    p2.bench[0].pokemons.cards = [new LatiasEx()];
    p2.bench[1].pokemons.cards = [new TestPokemon()];
    TestUtils.setActive(sim2, [new TestPokemon(), new TestStage1()]);
    expect(() => sim2.dispatch(new RetreatAction(1, 1))).toThrow();
  });

  it('Latias ex Eon Blade does 200 and can\'t be used next turn', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new LatiasEx()], [CardType.PSYCHIC, CardType.PSYCHIC, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Eon Blade'));
    expect(opponent.active.damage).toEqual(200);
    expect(player.active.marker.markers.length).toBeGreaterThan(0);
  });

  it('Annihilape Ghostly Blow does 100 and places 5 damage counters on a Benched Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.bench[0].pokemons.cards = [new TestPokemon()];
    TestUtils.setActive(sim, [new Annihilape()], [CardType.PSYCHIC, CardType.PSYCHIC]);
    sim.dispatch(new AttackAction(1, 'Ghostly Blow'));
    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[0]]));
    expect(opponent.active.damage).toEqual(100);
    expect(opponent.bench[0].damage).toEqual(50);
  });

  it('Annihilape Durable Body keeps it in play with 10 HP on heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new Annihilape()]);
    opponent.bench[0].pokemons.cards = [new TestPokemon()];
    const attacker = new TestPokemon();
    attacker.attacks = [{ name: 'Big hit', cost: [], damage: '300', text: '' }];
    TestUtils.setActive(sim, [attacker]);
    sim.dispatch(new AttackAction(1, 'Big hit'));
    expect(opponent.active.getPokemonCard() instanceof Annihilape).toBeTrue();
    expect(opponent.active.damage).toEqual(140);
  });

  it('Annihilape Durable Body on tails: Knocked Out', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);
    TestUtils.setDefending(sim, [new Annihilape()]);
    opponent.bench[0].pokemons.cards = [new TestPokemon()];
    const attacker = new TestPokemon();
    attacker.attacks = [{ name: 'Big hit', cost: [], damage: '300', text: '' }];
    TestUtils.setActive(sim, [attacker]);
    sim.dispatch(new AttackAction(1, 'Big hit'));
    expect(opponent.discard.cards.some(c => c instanceof Annihilape)).toBeTrue();
  });

  it('Drapion Wrack Down does 60', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TestPokemon(), new Drapion()], [CardType.DARK, CardType.DARK]);
    sim.dispatch(new AttackAction(1, 'Wrack Down'));
    expect(opponent.active.damage).toEqual(60);
  });

  it('Zeraora Thunder Raid discards all Energy and does 210 to a Benched Pokémon ex', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.bench[0].pokemons.cards = [new TestPokemon()];
    opponent.bench[1].pokemons.cards = [new TestEx()];
    TestUtils.setActive(sim, [new ZeraoraDRI()], [CardType.LIGHTNING, CardType.LIGHTNING, CardType.LIGHTNING]);
    sim.dispatch(new AttackAction(1, 'Thunder Raid'));
    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    expect(prompt.options.blocked.length).toEqual(1);
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[1]]));
    expect(opponent.bench[1].damage).toEqual(210);
    expect(opponent.active.damage).toEqual(0);
    expect(player.active.energies.cards.length).toEqual(0);
  });

  it('Zeraora Scratch does 20', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new ZeraoraDRI()], [CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Scratch'));
    expect(opponent.active.damage).toEqual(20);
  });

  it('Mew ex Memory Helix uses an attack of a Benched Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const drapion = new Drapion();
    player.bench[0].pokemons.cards = [new TestPokemon(), drapion];
    TestUtils.setActive(sim, [new MewEx30C()], [CardType.DARK, CardType.DARK]);
    sim.dispatch(new UseAbilityAction(1, 'Memory Helix', TestUtils.target(sim, player.active)));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseAttackPrompt;
    // Hazardous Tail needs 3 Energy: blocked.
    expect(prompt.options.blocked).toEqual([{ index: 0, name: 'Hazardous Tail' }]);
    sim.dispatch(new ResolvePromptAction(prompt.id, drapion.attacks[0]));
    expect(opponent.active.damage).toEqual(60);
  });

  it('Mew ex Teleportation Burst does 30 and may switch', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const mew = new MewEx30C();
    const benched = new TestPokemon();
    player.bench[0].pokemons.cards = [benched];
    TestUtils.setActive(sim, [mew], [CardType.PSYCHIC]);
    sim.dispatch(new AttackAction(1, 'Teleportation Burst'));
    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [player.bench[0]]));
    expect(opponent.active.damage).toEqual(30);
    expect(player.active.getPokemonCard()).toBe(benched);
    expect(player.bench[0].getPokemonCard()).toBe(mew);
  });

  it('Ciphermaniac\'s Codebreaking puts 2 chosen cards on top in the chosen order', () => {
    const { player } = TestUtils.getAll(sim);
    const card = new CiphermaniacsCodebreaking();
    const cards = TestUtils.makeTestCards(6);
    const [a, b] = [cards[2], cards[4]];
    player.deck.cards = cards;
    player.hand.cards = [card];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    const choose = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect([choose.options.min, choose.options.max]).toEqual([2, 2]);
    sim.dispatch(new ResolvePromptAction(choose.id, [a, b]));
    const order = TestUtils.lastPrompt(sim, player) as OrderCardsPrompt;
    sim.dispatch(new ResolvePromptAction(order.id, [1, 0]));
    expect(player.deck.cards.slice(0, 2)).toEqual([b, a]);
    expect(player.deck.cards.length).toEqual(6);
  });

  it('Academy at Night puts a card from the hand on top of the deck, once a turn', () => {
    const { state, player } = TestUtils.getAll(sim);
    state.turn = 2;
    const [x, y] = TestUtils.makeTestCards(2);
    player.hand.cards = [x, y];
    player.stadium.cards = [new AcademyAtNight()];
    sim.dispatch(new UseStadiumAction(1));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [y]));
    expect(player.deck.cards[0]).toBe(y);
    expect(player.hand.cards).toEqual([x]);
    expect(() => sim.dispatch(new UseStadiumAction(1))).toThrow();
  });
});
