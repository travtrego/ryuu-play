import {
  AttackAction,
  AttackEffect,
  AttachEnergyPrompt,
  CardTag,
  CardType,
  ChooseCardsPrompt,
  ChoosePokemonPrompt,
  ConfirmPrompt,
  DealDamageEffect,
  GameError,
  GameMessage,
  MoveEnergyPrompt,
  PlayCardAction,
  ResolvePromptAction,
  RetreatAction,
  Simulator,
  Stage,
  UseAbilityAction,
} from '@ptcg/common';

import { TealMaskOgerponEx } from '../../../src/standard/set-twilight-masquerade/teal-mask-ogerpon-ex';
import { WellspringMaskOgerponEx } from '../../../src/standard/set-twilight-masquerade/wellspring-mask-ogerpon-ex';
import { RagingBoltEx } from '../../../src/standard/set-temporal-forces/raging-bolt-ex';
import { IronCrownEx } from '../../../src/standard/set-temporal-forces/iron-crown-ex';
import { IronLeavesEx } from '../../../src/standard/set-temporal-forces/iron-leaves-ex';
import { ChienPao } from '../../../src/standard/set-surging-sparks/chien-pao';
import { Passimian } from '../../../src/standard/set-surging-sparks/passimian';
import { GlassTrumpet } from '../../../src/standard/set-stellar-crown/glass-trumpet';
import { AreaZeroUnderdepths } from '../../../src/standard/set-stellar-crown/area-zero-underdepths';
import { MegaKangaskhanEx } from '../../../src/standard/set-mega-evolution/mega-kangaskhan-ex';
import { FestivalGrounds } from '../../../src/standard/set-twilight-masquerade/festival-grounds';
import { GrassEnergy } from '../../../src/standard/set-diamond-and-pearl/grass-energy';
import { FireEnergy } from '../../../src/standard/set-diamond-and-pearl/fire-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class FirePokemon extends TestPokemon {
  public cardTypes = [CardType.FIRE];
  public weakness = [{ type: CardType.PSYCHIC }];
}

describe('Basic Box deck cards', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  it('Should have the printed stats', () => {
    const fire = [{ type: CardType.FIRE }];
    const teal = new TealMaskOgerponEx();
    expect([teal.hp, teal.stage, teal.cardTypes, teal.weakness, teal.retreat.length, teal.tags])
      .toEqual([210, Stage.BASIC, [CardType.GRASS], fire, 1, [CardTag.POKEMON_EX, CardTag.TERA]]);
    const well = new WellspringMaskOgerponEx();
    expect([well.hp, well.cardTypes, well.weakness, well.retreat.length, well.tags])
      .toEqual([210, [CardType.WATER], [{ type: CardType.LIGHTNING }], 1, [CardTag.POKEMON_EX, CardTag.TERA]]);
    const bolt = new RagingBoltEx();
    expect([bolt.hp, bolt.cardTypes, bolt.weakness, bolt.retreat.length, bolt.tags])
      .toEqual([240, [CardType.DRAGON], [], 3, [CardTag.POKEMON_EX, CardTag.ANCIENT]]);
    expect(bolt.attacks[1].cost).toEqual([CardType.LIGHTNING, CardType.FIGHTING]);
    const crown = new IronCrownEx();
    expect([crown.hp, crown.cardTypes, crown.weakness, crown.retreat.length, crown.tags])
      .toEqual([220, [CardType.PSYCHIC], [{ type: CardType.DARK }], 2, [CardTag.POKEMON_EX, CardTag.FUTURE]]);
    expect(crown.resistance).toEqual([{ type: CardType.FIGHTING, value: -30 }]);
    const leaves = new IronLeavesEx();
    expect([leaves.hp, leaves.cardTypes, leaves.weakness, leaves.retreat.length, leaves.tags])
      .toEqual([220, [CardType.GRASS], fire, 1, [CardTag.POKEMON_EX, CardTag.FUTURE]]);
    const pao = new ChienPao();
    expect([pao.hp, pao.cardTypes, pao.weakness, pao.retreat.length, pao.tags])
      .toEqual([120, [CardType.WATER], [{ type: CardType.METAL }], 1, []]);
    const passimian = new Passimian();
    expect([passimian.hp, passimian.cardTypes, passimian.weakness, passimian.retreat.length])
      .toEqual([110, [CardType.FIGHTING], [{ type: CardType.PSYCHIC }], 1]);
  });

  it('Teal Dance attaches a Basic Grass Energy from the hand and draws a card, once a turn', () => {
    const { player } = TestUtils.getAll(sim);
    const teal = new TealMaskOgerponEx();
    player.bench[0].pokemons.cards = [teal];
    const fireEnergy = new FireEnergy();
    const grass1 = new GrassEnergy();
    const grass2 = new GrassEnergy();
    player.hand.cards = [fireEnergy, grass1, grass2];
    const deckSize = player.deck.cards.length;

    sim.dispatch(new UseAbilityAction(1, 'Teal Dance', TestUtils.target(sim, player.bench[0])));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt.options.blocked).toEqual([0]);
    expect(prompt.validate([fireEnergy])).toBeFalse();
    sim.dispatch(new ResolvePromptAction(prompt.id, [grass1]));
    expect(player.bench[0].energies.cards).toEqual([grass1]);
    expect(player.deck.cards.length).toEqual(deckSize - 1);
    expect(player.hand.cards.length).toEqual(3);

    expect(() => sim.dispatch(new UseAbilityAction(1, 'Teal Dance', TestUtils.target(sim, player.bench[0]))))
      .toThrowMatching((e: GameError) => e.message === GameMessage.POWER_ALREADY_USED);
  });

  it('Teal Dance can\'t be used without a Basic Grass Energy in the hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0].pokemons.cards = [new TealMaskOgerponEx()];
    player.hand.cards = [new FireEnergy()];
    expect(() => sim.dispatch(new UseAbilityAction(1, 'Teal Dance', TestUtils.target(sim, player.bench[0]))))
      .toThrow();
  });

  it('Myriad Leaf Shower does 30 more for each Energy on both Active Pokémon', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestPokemon()], [CardType.FIRE, CardType.FIRE]);
    TestUtils.setActive(sim, [new TealMaskOgerponEx()], [CardType.GRASS, CardType.GRASS, CardType.GRASS]);
    sim.dispatch(new AttackAction(1, 'Myriad Leaf Shower'));
    expect(opponent.active.damage).toEqual(30 + 30 * 5);
  });

  it('Sob: the Defending Pokémon can\'t retreat during the opponent\'s next turn', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.bench[0].pokemons.cards = [new TestPokemon()];
    TestUtils.setActive(sim, [new WellspringMaskOgerponEx()], [CardType.WATER]);
    sim.dispatch(new AttackAction(1, 'Sob'));
    expect(opponent.active.damage).toEqual(20);
    expect(() => sim.dispatch(new RetreatAction(2, 0))).toThrow();
  });

  it('Torrential Pump: shuffling 3 Energy into the deck also does 120 to a Benched Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const benched = new FirePokemon();
    opponent.bench[0].pokemons.cards = [benched];
    TestUtils.setActive(sim, [new WellspringMaskOgerponEx()], [CardType.WATER, CardType.WATER, CardType.WATER]);
    const deckSize = player.deck.cards.length;
    sim.dispatch(new AttackAction(1, 'Torrential Pump'));

    const energies = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(energies.options.min).toEqual(3);
    sim.dispatch(new ResolvePromptAction(energies.id, player.active.energies.cards.slice()));
    expect(player.active.energies.cards.length).toEqual(0);
    expect(player.deck.cards.length).toEqual(deckSize + 3);

    const target = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(target.id, [opponent.bench[0]]));
    expect(opponent.active.damage).toEqual(100);
    expect(opponent.bench[0].damage).toEqual(120);
  });

  it('Torrential Pump: declining keeps the Energy and does only 100', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.bench[0].pokemons.cards = [new TestPokemon()];
    TestUtils.setActive(sim, [new WellspringMaskOgerponEx()], [CardType.WATER, CardType.WATER, CardType.WATER]);
    sim.dispatch(new AttackAction(1, 'Torrential Pump'));
    const energies = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(energies.id, null));
    expect(player.active.energies.cards.length).toEqual(3);
    expect(opponent.active.damage).toEqual(100);
    expect(opponent.bench[0].damage).toEqual(0);
  });

  it('Burst Roar discards the hand and draws 6 cards', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = TestUtils.makeTestCards(3);
    TestUtils.setActive(sim, [new RagingBoltEx()], [CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Burst Roar'));
    expect(player.discard.cards.length).toEqual(3);
    expect(player.hand.cards.length).toEqual(6);
  });

  it('Bellowing Thunder does 70 for each Basic Energy discarded from any of your Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const grass = new GrassEnergy();
    player.bench[0].pokemons.cards = [new TestPokemon()];
    player.bench[0].energies.cards = [grass];
    TestUtils.setActive(sim, [new RagingBoltEx()], [CardType.LIGHTNING, CardType.FIGHTING]);
    sim.dispatch(new AttackAction(1, 'Bellowing Thunder'));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt.cards.cards.length).toEqual(3);
    sim.dispatch(new ResolvePromptAction(prompt.id, [player.active.energies.cards[0], grass]));
    expect(player.bench[0].energies.cards.length).toEqual(0);
    expect(player.active.energies.cards.length).toEqual(1);
    expect(player.discard.cards.length).toEqual(2);
    expect(opponent.active.damage).toEqual(140);
  });

  it('Bellowing Thunder does nothing when no Energy is discarded', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new RagingBoltEx()], [CardType.LIGHTNING, CardType.FIGHTING]);
    sim.dispatch(new AttackAction(1, 'Bellowing Thunder'));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, []));
    expect(opponent.active.damage).toEqual(0);
  });

  it('Cobalt Command: +20 to the opponent\'s Active for Future Pokémon, not for Iron Crown ex or others', () => {
    const { state, player, opponent } = TestUtils.getAll(sim);
    player.bench[0].pokemons.cards = [new IronCrownEx()];
    const deal = (attacker: TestPokemon | IronLeavesEx | IronCrownEx, toBench = false) => {
      TestUtils.setActive(sim, [attacker]);
      const attack = new AttackEffect(player, opponent, attacker.attacks[0]);
      const dealDamage = new DealDamageEffect(attack, 100);
      if (toBench) {
        opponent.bench[0].pokemons.cards = [new TestPokemon()];
        dealDamage.target = opponent.bench[0];
      }
      sim.store.reduceEffect(state, dealDamage);
      return dealDamage.damage;
    };
    expect(deal(new IronLeavesEx())).toEqual(120);
    expect(deal(new IronLeavesEx(), true)).toEqual(100);
    expect(deal(new IronCrownEx())).toEqual(100);
    expect(deal(new TestPokemon())).toEqual(100);
    // Two Iron Crown ex: two Abilities, +40.
    player.bench[1].pokemons.cards = [new IronCrownEx()];
    expect(deal(new IronLeavesEx())).toEqual(140);
  });

  it('Twin Shotels does 50 to 2 of the opponent\'s Pokémon, without Weakness', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new FirePokemon()]);
    opponent.bench[0].pokemons.cards = [new TestPokemon()];
    opponent.bench[1].pokemons.cards = [new TealMaskOgerponEx()];
    TestUtils.setActive(sim, [new IronCrownEx()], [CardType.PSYCHIC, CardType.COLORLESS, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Twin Shotels'));
    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    expect([prompt.options.min, prompt.options.max]).toEqual([2, 2]);
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.active, opponent.bench[0]]));
    expect(opponent.active.damage).toEqual(50);
    expect(opponent.bench[0].damage).toEqual(50);
  });

  it('Rapid Vernier: switches in from the Bench and moves Energy from the other Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    const leaves = new IronLeavesEx();
    const oldActive = player.active.getPokemonCard();
    TestUtils.setActive(sim, [oldActive as TestPokemon], [CardType.GRASS, CardType.GRASS]);
    player.hand.cards = [leaves];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.bench[0])));

    const confirm = TestUtils.lastPrompt(sim, player) as ConfirmPrompt;
    expect(confirm instanceof ConfirmPrompt).toBeTrue();
    sim.dispatch(new ResolvePromptAction(confirm.id, true));
    expect(player.active.getPokemonCard()).toBe(leaves);
    expect(player.bench[0].getPokemonCard()).toBe(oldActive);

    const move = TestUtils.lastPrompt(sim, player) as MoveEnergyPrompt;
    expect(move instanceof MoveEnergyPrompt).toBeTrue();
    const from = TestUtils.target(sim, player.bench[0]);
    const to = TestUtils.target(sim, player.active);
    sim.dispatch(new ResolvePromptAction(move.id, player.bench[0].energies.cards.slice()
      .map(card => ({ from, to, card }))));
    expect(player.active.energies.cards.length).toEqual(2);
    expect(player.bench[0].energies.cards.length).toEqual(0);
  });

  it('Rapid Vernier: declining leaves Iron Leaves ex on the Bench', () => {
    const { player } = TestUtils.getAll(sim);
    const leaves = new IronLeavesEx();
    player.hand.cards = [leaves];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.bench[0])));
    const confirm = TestUtils.lastPrompt(sim, player) as ConfirmPrompt;
    sim.dispatch(new ResolvePromptAction(confirm.id, false));
    expect(player.bench[0].getPokemonCard()).toBe(leaves);
  });

  it('Prism Edge does 180', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new IronLeavesEx()], [CardType.GRASS, CardType.GRASS, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Prism Edge'));
    expect(opponent.active.damage).toEqual(180);
  });

  it('Snow Sink: playing Chien-Pao onto the Bench may discard the Stadium in play', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const stadium = new FestivalGrounds();
    opponent.stadium.cards = [stadium];
    player.hand.cards = [new ChienPao()];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.bench[0])));
    const confirm = TestUtils.lastPrompt(sim, player) as ConfirmPrompt;
    expect(confirm.message).toEqual(GameMessage.WANT_TO_DISCARD_STADIUM);
    sim.dispatch(new ResolvePromptAction(confirm.id, true));
    expect(opponent.stadium.cards.length).toEqual(0);
    expect(opponent.discard.cards).toEqual([stadium]);
  });

  it('Icicle Loop does 120 and puts an attached Energy into the hand', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new ChienPao()], [CardType.WATER, CardType.WATER, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Icicle Loop'));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [player.active.energies.cards[0]]));
    expect(opponent.active.damage).toEqual(120);
    expect(player.active.energies.cards.length).toEqual(2);
    expect(player.hand.cards.length).toEqual(1);
  });

  it('Coordinated Throwing does 20 for each of your Basic Pokémon in play', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0].pokemons.cards = [new TestPokemon()];
    player.bench[1].pokemons.cards = [new TestPokemon()];
    TestUtils.setActive(sim, [new Passimian()], [CardType.FIGHTING, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Coordinated Throwing'));
    expect(opponent.active.damage).toEqual(60);
  });

  it('Glass Trumpet needs a Tera Pokémon in play', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0].pokemons.cards = [new MegaKangaskhanEx()];
    player.discard.cards = [new GrassEnergy()];
    player.hand.cards = [new GlassTrumpet()];
    expect(() => sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)))).toThrow();
  });

  it('Glass Trumpet attaches Basic Energy from the discard pile to up to 2 Benched Colorless Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0].pokemons.cards = [new MegaKangaskhanEx()];
    player.bench[1].pokemons.cards = [new MegaKangaskhanEx()];
    player.bench[2].pokemons.cards = [new TealMaskOgerponEx()];
    const grass1 = new GrassEnergy();
    const grass2 = new GrassEnergy();
    player.discard.cards = [grass1, grass2];
    player.hand.cards = [new GlassTrumpet()];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    const prompt = TestUtils.lastPrompt(sim, player) as AttachEnergyPrompt;
    expect(prompt.options.max).toEqual(2);
    expect(prompt.options.blockedTo).toEqual([TestUtils.target(sim, player.bench[2])]);
    // Both on the same Pokémon is not allowed.
    expect(prompt.validate([
      { to: TestUtils.target(sim, player.bench[0]), card: grass1 },
      { to: TestUtils.target(sim, player.bench[0]), card: grass2 }])).toBeFalse();
    sim.dispatch(new ResolvePromptAction(prompt.id, [
      { to: TestUtils.target(sim, player.bench[0]), card: grass1 },
      { to: TestUtils.target(sim, player.bench[1]), card: grass2 }]));
    expect(player.bench[0].energies.cards).toEqual([grass1]);
    expect(player.bench[1].energies.cards).toEqual([grass2]);
  });

  it('Area Zero Underdepths: 8 Bench spots only for a player with a Tera Pokémon in play, back to 5 without', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0].pokemons.cards = [new TealMaskOgerponEx()];
    player.stadium.cards = [new AreaZeroUnderdepths()];
    player.hand.cards = [new TestPokemon()];
    // Any action runs the between-actions check; playing a Basic is one.
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.bench[1])));
    expect(player.bench.length).toEqual(8);
    expect(opponent.bench.length).toEqual(5);

    // Fill the Bench to 7, then lose the Tera Pokémon: discard down to 5.
    for (let i = 2; i < 7; i++) {
      player.bench[i].pokemons.cards = [new TestPokemon()];
    }
    player.bench[0].pokemons.moveTo(player.discard);
    player.hand.cards = [new TestPokemon()];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.bench[0])));
    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    expect(prompt.message).toEqual(GameMessage.CHOOSE_POKEMON_TO_DISCARD);
    expect([prompt.options.min, prompt.options.max]).toEqual([2, 2]);
    sim.dispatch(new ResolvePromptAction(prompt.id, [player.bench[1], player.bench[2]]));
    expect(player.bench.length).toEqual(5);
    expect(player.bench.every(b => b.pokemons.cards.length === 1)).toBeTrue();
  });
});
