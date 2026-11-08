import {
  AddSpecialConditionsEffect,
  AttachEnergyPrompt,
  AttackAction,
  AttackEffect,
  CardTag,
  CardType,
  CheckHpEffect,
  ChooseCardsPrompt,
  ChooseEnergyPrompt,
  ChoosePokemonPrompt,
  KnockOutEffect,
  PlayCardAction,
  PlayerType,
  ResolvePromptAction,
  SelectPrompt,
  Simulator,
  SlotType,
  SpecialCondition,
  Stage,
  UseAbilityAction,
} from '@ptcg/common';

import { Drilbur } from '../../../src/standard/set-pitch-black/drilbur';
import { MegaExcadrillEx } from '../../../src/standard/set-pitch-black/mega-excadrill-ex';
import { Beldum as BeldumTEF } from '../../../src/standard/set-temporal-forces/beldum';
import { Metang } from '../../../src/standard/set-temporal-forces/metang';
import { HerosCape } from '../../../src/standard/set-temporal-forces/heros-cape';
import { Beldum as BeldumCRI } from '../../../src/standard/set-chaos-rising/beldum';
import { Metagross } from '../../../src/standard/set-chaos-rising/metagross';
import { Piplup } from '../../../src/standard/set-phantasmal-flames/piplup';
import { EmpoleonEx } from '../../../src/standard/set-phantasmal-flames/empoleon-ex';
import { JumboIceCream } from '../../../src/standard/set-phantasmal-flames/jumbo-ice-cream';
import { GenesectEx } from '../../../src/standard/set-black-bolt/genesect-ex';
import { MegaSkarmoryEx } from '../../../src/standard/set-perfect-order/mega-skarmory-ex';
import { Kieran } from '../../../src/standard/set-twilight-masquerade/kieran';
import { Pokegear30SVI } from '../../../src/standard/set-scarlet-and-violet/pokegear-30';
import { SwitchMEG } from '../../../src/standard/set-mega-evolution/switch';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class TestEx extends TestPokemon {
  public tags = [CardTag.POKEMON_EX];
}

class MetalStage1 extends TestPokemon {
  public stage = Stage.STAGE_1;
  public cardTypes = [CardType.METAL];
  public name = 'Metal Evolution';
  public fullName = 'Metal Evolution TEST';
}

describe('Mega Excadrill ex deck cards', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  it('Should have the printed stats', () => {
    const grass30 = [{ type: CardType.GRASS, value: -30 }];
    const fire = [{ type: CardType.FIRE }];
    const excadrill = new MegaExcadrillEx();
    expect([excadrill.hp, excadrill.stage, excadrill.evolvesFrom, excadrill.retreat.length])
      .toEqual([340, Stage.STAGE_1, 'Drilbur', 4]);
    expect([excadrill.weakness, excadrill.resistance]).toEqual([fire, grass30]);
    expect(excadrill.tags).toEqual([CardTag.POKEMON_EX, CardTag.MEGA_EVOLUTION_EX]);

    const drilbur = new Drilbur();
    expect([drilbur.hp, drilbur.cardTypes, drilbur.weakness, drilbur.retreat.length])
      .toEqual([70, [CardType.FIGHTING], [{ type: CardType.GRASS }], 2]);

    for (const beldum of [new BeldumTEF(), new BeldumCRI()]) {
      expect([beldum.hp, beldum.weakness, beldum.resistance, beldum.retreat.length]).toEqual([70, fire, grass30, 1]);
    }
    const metang = new Metang();
    expect([metang.hp, metang.evolvesFrom, metang.retreat.length]).toEqual([100, 'Beldum', 2]);
    const metagross = new Metagross();
    expect([metagross.hp, metagross.stage, metagross.evolvesFrom, metagross.retreat.length])
      .toEqual([180, Stage.STAGE_2, 'Metang', 3]);

    const piplup = new Piplup();
    expect([piplup.hp, piplup.cardTypes, piplup.weakness, piplup.retreat.length])
      .toEqual([70, [CardType.WATER], [{ type: CardType.LIGHTNING }], 1]);
    const empoleon = new EmpoleonEx();
    expect([empoleon.hp, empoleon.stage, empoleon.evolvesFrom, empoleon.cardTypes, empoleon.retreat.length])
      .toEqual([320, Stage.STAGE_2, 'Prinplup', [CardType.METAL], 2]);
    expect(empoleon.tags).toEqual([CardTag.POKEMON_EX]);

    const genesect = new GenesectEx();
    expect([genesect.hp, genesect.stage, genesect.weakness, genesect.resistance, genesect.retreat.length])
      .toEqual([220, Stage.BASIC, fire, grass30, 2]);

    const skarmory = new MegaSkarmoryEx();
    expect([skarmory.hp, skarmory.stage, skarmory.retreat.length]).toEqual([260, Stage.BASIC, 0]);
    expect(skarmory.weakness).toEqual([{ type: CardType.LIGHTNING }]);
    expect(skarmory.resistance).toEqual([{ type: CardType.FIGHTING, value: -30 }]);
    expect(skarmory.tags).toEqual([CardTag.POKEMON_EX, CardTag.MEGA_EVOLUTION_EX]);

    expect(new HerosCape().tags).toContain(CardTag.ACE_SPEC);
    expect(new Pokegear30SVI().fullName).toEqual('Pokégear 3.0 SVI');
    expect(new SwitchMEG().fullName).toEqual('Switch MEG');
  });

  it('a Mega Evolution Pokémon ex gives up 3 Prize cards, a Pokémon ex 2', () => {
    const { state, opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new Drilbur(), new MegaExcadrillEx()]);
    const mega = new KnockOutEffect(opponent, opponent.active);
    sim.store.reduceEffect(state, mega);
    expect(mega.prizeCount).toEqual(3);

    TestUtils.setDefending(sim, [new GenesectEx()]);
    const ex = new KnockOutEffect(opponent, opponent.active);
    sim.store.reduceEffect(state, ex);
    expect(ex.prizeCount).toEqual(2);
  });

  it('knocking out a Mega Excadrill ex in play takes 3 Prize cards', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.bench[0].pokemons.cards = [new TestPokemon()];
    TestUtils.setDefending(sim, [new Drilbur(), new MegaExcadrillEx()]);
    opponent.active.damage = 330;
    TestUtils.setActive(sim, [new TestPokemon()]);
    sim.dispatch(new AttackAction(1, 'Test attack'));
    // Answer every prompt (prize picks, the opponent's new Active) with the first options.
    for (let i = 0; i < 5; i++) {
      const prompt = sim.store.state.prompts.find(p => p.result === undefined);
      if (prompt === undefined) {
        break;
      }
      if (prompt instanceof ChoosePokemonPrompt) {
        sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[0]]));
      } else {
        sim.dispatch(new ResolvePromptAction(prompt.id, (prompt as any).options?.count
          ? player.prizes.filter(p => p.cards.length > 0).slice(0, (prompt as any).options.count)
          : null));
      }
    }
    expect(player.getPrizeLeft()).toEqual(3);
  });

  it('Undermine does 90 and discards the top 2 cards of the opponent\'s deck', () => {
    const { opponent } = TestUtils.getAll(sim);
    const top = opponent.deck.cards.slice(0, 2);
    TestUtils.setActive(sim, [new Drilbur(), new MegaExcadrillEx()], [CardType.METAL, CardType.METAL]);
    sim.dispatch(new AttackAction(1, 'Undermine'));
    expect(opponent.active.damage).toEqual(90);
    expect(opponent.discard.cards).toEqual(top);
  });

  it('Maximum Drilling does 200, or 330 with 2 extra Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Drilbur(), new MegaExcadrillEx()],
      [CardType.METAL, CardType.METAL, CardType.METAL, CardType.METAL]);
    sim.dispatch(new AttackAction(1, 'Maximum Drilling'));
    expect(opponent.active.damage).toEqual(200);

    const sim2 = TestUtils.createTestSimulator();
    TestUtils.setActive(sim2, [new Drilbur(), new MegaExcadrillEx()],
      [CardType.METAL, CardType.METAL, CardType.METAL, CardType.METAL, CardType.COLORLESS]);
    sim2.dispatch(new AttackAction(1, 'Maximum Drilling'));
    expect(TestUtils.getAll(sim2).opponent.active.damage).toEqual(330);
  });

  it('Drilbur Call for Family benches up to 2 Basic Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    const a = new BeldumTEF();
    const b = new GenesectEx();
    const evo = new Metang();
    player.deck.cards = [evo, a, b];
    TestUtils.setActive(sim, [new Drilbur()], [CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Call for Family'));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt.options.max).toEqual(2);
    sim.dispatch(new ResolvePromptAction(prompt.id, [a, b]));
    expect(player.bench[0].pokemons.cards).toEqual([a]);
    expect(player.bench[1].pokemons.cards).toEqual([b]);
  });

  it('Beldum TEF Iron Tackle does 50 and 10 to itself', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new BeldumTEF()], [CardType.METAL, CardType.COLORLESS, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Iron Tackle'));
    expect(opponent.active.damage).toEqual(50);
    expect(player.active.damage).toEqual(10);
  });

  it('Metang Metal Maker attaches Basic M Energy from the top 4 and puts the rest on the bottom', () => {
    const { player } = TestUtils.getAll(sim);
    const [m1, m2] = TestUtils.makeEnergies([CardType.METAL, CardType.METAL]);
    const [f1] = TestUtils.makeEnergies([CardType.FIRE]);
    const [x] = TestUtils.makeTestCards(1);
    const rest = TestUtils.makeTestCards(5);
    player.deck.cards = [m1, x, f1, m2, ...rest];
    player.bench[0].pokemons.cards = [new BeldumTEF(), new Metang()];
    const target = TestUtils.target(sim, player.bench[0]);
    sim.dispatch(new UseAbilityAction(1, 'Metal Maker', target));
    const prompt = TestUtils.lastPrompt(sim, player) as AttachEnergyPrompt;
    expect(prompt instanceof AttachEnergyPrompt).toBeTrue();
    expect(prompt.options.max).toEqual(2);
    sim.dispatch(new ResolvePromptAction(prompt.id, [
      { to: { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 }, card: m1 },
      { to: { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 }, card: m2 },
    ]));
    expect(player.active.energies.cards).toEqual([m1]);
    expect(player.bench[0].energies.cards).toEqual([m2]);
    expect(player.deck.cards.slice(0, 5)).toEqual(rest);
    const bottom = player.deck.cards.slice(5);
    expect(bottom.length).toEqual(2);
    expect(bottom).toContain(x);
    expect(bottom).toContain(f1);
    expect(() => sim.dispatch(new UseAbilityAction(1, 'Metal Maker', target))).toThrow();
  });

  it('Metagross Bounce Back does 60 and the opponent switches', () => {
    const { opponent } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();
    const benched = new TestPokemon();
    opponent.bench[0].pokemons.cards = [benched];
    TestUtils.setActive(sim, [new BeldumCRI(), new Metang(), new Metagross()], [CardType.METAL]);
    sim.dispatch(new AttackAction(1, 'Bounce Back'));
    const prompt = TestUtils.lastPrompt(sim, opponent) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[0]]));
    expect(opponent.active.getPokemonCard()).toBe(benched);
    expect(opponent.bench[0].getPokemonCard()).toBe(defending);
    expect(opponent.bench[0].damage).toEqual(60);
  });

  it('Metagross Metallic Hammer may discard 3 M Energy for 300', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new BeldumCRI(), new Metang(), new Metagross()],
      [CardType.METAL, CardType.METAL, CardType.METAL, CardType.METAL]);
    sim.dispatch(new AttackAction(1, 'Metallic Hammer'));
    const select = TestUtils.lastPrompt(sim, player) as SelectPrompt;
    sim.dispatch(new ResolvePromptAction(select.id, 0));
    const choose = TestUtils.lastPrompt(sim, player) as ChooseEnergyPrompt;
    const energies = player.active.energies.cards.slice(0, 3).map(card => ({ card, provides: [CardType.METAL] }));
    sim.dispatch(new ResolvePromptAction(choose.id, energies));
    expect(opponent.active.damage).toEqual(300);
    expect(player.active.energies.cards.length).toEqual(1);
    expect(player.discard.cards.length).toEqual(3);
  });

  it('Metallic Hammer without discarding does 150', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new BeldumCRI(), new Metang(), new Metagross()],
      [CardType.METAL, CardType.METAL, CardType.METAL, CardType.METAL]);
    sim.dispatch(new AttackAction(1, 'Metallic Hammer'));
    const select = TestUtils.lastPrompt(sim, player) as SelectPrompt;
    sim.dispatch(new ResolvePromptAction(select.id, 1));
    expect(opponent.active.damage).toEqual(150);
    expect(player.active.energies.cards.length).toEqual(4);
  });

  it('Piplup Call for Support finds a Supporter', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const kieran = new Kieran();
    player.deck.cards = [...TestUtils.makeTestCards(3), kieran];
    TestUtils.setActive(sim, [new Piplup()], [CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Call for Support'));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [kieran]));
    const show = TestUtils.lastPrompt(sim, opponent)!;
    sim.dispatch(new ResolvePromptAction(show.id, true));
    expect(player.hand.cards).toEqual([kieran]);
  });

  it('Empoleon ex Emperor\'s Stance prevents effects of attacks, not damage', () => {
    const { state, player, opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new Piplup(), new EmpoleonEx()]);
    const attack = new AttackEffect(player, opponent, player.active.getPokemonCard()!.attacks[0]);
    const poison = new AddSpecialConditionsEffect(attack, [SpecialCondition.POISONED]);
    sim.store.reduceEffect(state, poison);
    expect(opponent.active.specialConditions).toEqual([]);
    sim.dispatch(new AttackAction(1, 'Test attack'));
    expect(opponent.active.damage).toEqual(10);
  });

  it('Empoleon ex Iron Feathers does 210 and takes 60 less damage next turn', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Piplup(), new EmpoleonEx()], [CardType.METAL, CardType.METAL, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Iron Feathers'));
    const opponent = TestUtils.getAll(sim).opponent;
    expect(opponent.active.damage).toEqual(210);
    opponent.active.pokemons.cards[0].attacks[0].damage = '100';
    sim.dispatch(new AttackAction(2, 'Test attack'));
    expect(player.active.damage).toEqual(40);
  });

  it('Genesect ex Metallic Signal finds up to 2 Evolution M Pokémon, once per turn', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const metang = new Metang();
    const evo = new MetalStage1();
    const basic = new BeldumTEF();
    const nonMetal = new TestPokemon();
    nonMetal.stage = Stage.STAGE_1;
    player.deck.cards = [basic, metang, nonMetal, evo];
    player.bench[0].pokemons.cards = [new GenesectEx()];
    const target = TestUtils.target(sim, player.bench[0]);
    sim.dispatch(new UseAbilityAction(1, 'Metallic Signal', target));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect([prompt.options.max, prompt.options.blocked]).toEqual([2, [0, 2]]);
    sim.dispatch(new ResolvePromptAction(prompt.id, [metang, evo]));
    const show = TestUtils.lastPrompt(sim, opponent)!;
    sim.dispatch(new ResolvePromptAction(show.id, true));
    expect(player.hand.cards).toEqual([metang, evo]);
    expect(() => sim.dispatch(new UseAbilityAction(1, 'Metallic Signal', target))).toThrow();
  });

  it('Genesect ex Protect Charge does 150 and takes 30 less damage next turn', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new GenesectEx()], [CardType.METAL, CardType.METAL, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Protect Charge'));
    const opponent = TestUtils.getAll(sim).opponent;
    expect(opponent.active.damage).toEqual(150);
    opponent.active.pokemons.cards[0].attacks[0].damage = '100';
    sim.dispatch(new AttackAction(2, 'Test attack'));
    expect(player.active.damage).toEqual(70);
  });

  it('Mega Skarmory ex Sonic Ripper shuffles its Energy away and does 220 to a Benched Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.bench[0].pokemons.cards = [new TestPokemon()];
    TestUtils.setActive(sim, [new MegaSkarmoryEx()], [CardType.METAL, CardType.METAL, CardType.COLORLESS]);
    const deckBefore = player.deck.cards.length;
    sim.dispatch(new AttackAction(1, 'Sonic Ripper'));
    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[0]]));
    expect(player.active.energies.cards).toEqual([]);
    expect(player.deck.cards.length).toEqual(deckBefore + 3);
    expect(opponent.bench[0].damage).toEqual(220);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Sonic Ripper on the Active Pokémon applies Weakness', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const weak = new TestPokemon();
    weak.weakness = [{ type: CardType.METAL }];
    weak.hp = 500;
    TestUtils.setDefending(sim, [weak]);
    TestUtils.setActive(sim, [new MegaSkarmoryEx()], [CardType.METAL, CardType.METAL, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Sonic Ripper'));
    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.active]));
    expect(opponent.active.damage).toEqual(440);
  });

  it('Kieran: 30 more damage to the opponent\'s Active Pokémon ex this turn', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestEx()]);
    player.bench[0].pokemons.cards = [new TestPokemon()];
    player.hand.cards = [new Kieran()];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    const select = TestUtils.lastPrompt(sim, player) as SelectPrompt;
    sim.dispatch(new ResolvePromptAction(select.id, 1));
    sim.dispatch(new AttackAction(1, 'Test attack'));
    expect(opponent.active.damage).toEqual(40);
  });

  it('Kieran does not boost damage to a Pokémon that is not ex, and can switch instead', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const benched = new TestPokemon();
    player.bench[0].pokemons.cards = [benched];
    player.hand.cards = [new Kieran()];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    const select = TestUtils.lastPrompt(sim, player) as SelectPrompt;
    sim.dispatch(new ResolvePromptAction(select.id, 0));
    const choose = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(choose.id, [player.bench[0]]));
    expect(player.active.getPokemonCard()).toBe(benched);
    sim.dispatch(new AttackAction(1, 'Test attack'));
    expect(opponent.active.damage).toEqual(10);
  });

  it('Jumbo Ice Cream heals 80 from an Active Pokémon with 3 or more Energy', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TestPokemon()], [CardType.METAL, CardType.METAL, CardType.METAL]);
    player.active.damage = 100;
    player.hand.cards = [new JumboIceCream()];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    expect(player.active.damage).toEqual(20);
  });

  it('Jumbo Ice Cream can\'t be played with fewer than 3 Energy on the Active Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TestPokemon()], [CardType.METAL, CardType.METAL]);
    player.active.damage = 100;
    player.hand.cards = [new JumboIceCream()];
    expect(() => sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)))).toThrow();
  });

  it('Hero\'s Cape gives +100 HP', () => {
    const { state, player } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new GenesectEx()], [], [new HerosCape()]);
    const check = new CheckHpEffect(player, player.active);
    sim.store.reduceEffect(state, check);
    expect(check.hp).toEqual(320);
  });

});
