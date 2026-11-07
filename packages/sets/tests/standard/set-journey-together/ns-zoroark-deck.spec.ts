import {
  AttachEnergyPrompt,
  AttackAction,
  CardTag,
  CardType,
  CheckRetreatCostEffect,
  ChooseAttackPrompt,
  ChooseCardsPrompt,
  ChoosePokemonPrompt,
  Effect,
  PassTurnAction,
  PlayCardAction,
  PlayerType,
  PutDamageEffect,
  ResolvePromptAction,
  SelectPrompt,
  Simulator,
  SlotType,
  SpecialCondition,
  Stage,
  State,
  StoreLike,
  UseAbilityAction,
} from '@ptcg/common';

import { NsZorua } from '../../../src/standard/set-journey-together/ns-zorua';
import { NsZoroarkEx } from '../../../src/standard/set-journey-together/ns-zoroark-ex';
import { NsPurrloin } from '../../../src/standard/set-journey-together/ns-purrloin';
import { NsReshiram } from '../../../src/standard/set-journey-together/ns-reshiram';
import { NsPPUp } from '../../../src/standard/set-journey-together/ns-pp-up';
import { BrocksScouting } from '../../../src/standard/set-journey-together/brocks-scouting';
import { BlackBeltsTraining } from '../../../src/standard/set-journey-together/black-belts-training';
import { NsZekrom } from '../../../src/standard/set-ascended-heroes/ns-zekrom';
import { AirBalloon } from '../../../src/standard/set-ascended-heroes/air-balloon';
import { PecharuntEx } from '../../../src/standard/set-shrouded-fable/pecharunt-ex';
import { Tatsugiri } from '../../../src/standard/set-twilight-masquerade/tatsugiri';
import { SecretBox } from '../../../src/standard/set-twilight-masquerade/secret-box';
import { Cyrano } from '../../../src/standard/set-surging-sparks/cyrano';
import { JaninesSecretArt } from '../../../src/standard/set-prismatic-evolutions/janines-secret-art';
import { BindingMochi } from '../../../src/standard/set-prismatic-evolutions/binding-mochi';
import { PunkHelmet } from '../../../src/standard/set-phantasmal-flames/punk-helmet';
import { Judge } from '../../../src/standard/set-perfect-order/judge';
import { BuddyBuddyPoffin } from '../../../src/standard/set-temporal-forces/buddy-buddy-poffin';
import { TeamRocketsWatchtower } from '../../../src/standard/set-destined-rivals/team-rockets-watchtower';
import { LuckyHelmet } from '../../../src/standard/set-twilight-masquerade/lucky-helmet';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class TestEx extends TestPokemon {
  public tags = [CardTag.POKEMON_EX];
}

class DarkTestPokemon extends TestPokemon {
  public cardTypes = [CardType.DARK];
  public name = 'Dark Pokemon';
  public fullName = 'Dark Pokemon TEST';
}

class Stage1Test extends TestPokemon {
  public stage = Stage.STAGE_1;
}

/** Takes 30 less damage from attacks: an "effect on the Defending Pokémon". */
class ShieldedPokemon extends TestPokemon {
  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PutDamageEffect && effect.target.getPokemonCard() === this) {
      effect.damage = Math.max(0, effect.damage - 30);
    }
    return state;
  }
}

describe('N\'s Zoroark ex deck cards', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  it('Should have the printed stats', () => {
    const zorua = new NsZorua();
    const zoroark = new NsZoroarkEx();
    const purrloin = new NsPurrloin();
    const reshiram = new NsReshiram();
    const zekrom = new NsZekrom();
    const pecharunt = new PecharuntEx();
    const tatsugiri = new Tatsugiri();
    expect([zorua.hp, zorua.retreat.length, zorua.weakness]).toEqual([70, 1, [{ type: CardType.GRASS }]]);
    expect([zoroark.hp, zoroark.stage, zoroark.evolvesFrom, zoroark.retreat.length])
      .toEqual([280, Stage.STAGE_1, 'N\'s Zorua', 2]);
    expect(zoroark.tags).toContain(CardTag.POKEMON_EX);
    expect(zoroark.weakness).toEqual([{ type: CardType.GRASS }]);
    expect([purrloin.hp, purrloin.retreat.length]).toEqual([70, 1]);
    expect([reshiram.hp, reshiram.retreat.length, reshiram.weakness]).toEqual([130, 2, []]);
    expect([zekrom.hp, zekrom.retreat.length, zekrom.weakness]).toEqual([130, 2, []]);
    expect([pecharunt.hp, pecharunt.retreat.length, pecharunt.weakness])
      .toEqual([190, 1, [{ type: CardType.FIGHTING }]]);
    expect(pecharunt.tags).toContain(CardTag.POKEMON_EX);
    expect([tatsugiri.hp, tatsugiri.retreat.length, tatsugiri.cardTypes]).toEqual([70, 1, [CardType.DRAGON]]);
    expect(new SecretBox().tags).toContain(CardTag.ACE_SPEC);
  });

  it('N\'s Zorua Scratch does 20', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new NsZorua()], [CardType.DARK]);
    sim.dispatch(new AttackAction(1, 'Scratch'));
    expect(opponent.active.damage).toEqual(20);
  });

  it('N\'s Purrloin Thieving Swipe puts a chosen card from the hand on the bottom of the deck', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const [a, b] = TestUtils.makeTestCards(2);
    opponent.hand.cards = [a, b];
    TestUtils.setActive(sim, [new NsPurrloin()], [CardType.DARK, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Thieving Swipe'));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [b]));
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.deck.cards[opponent.deck.cards.length - 1]).toBe(b);
    expect(opponent.hand.cards.includes(b)).toBeFalse();
  });

  it('N\'s Reshiram Powerful Rage does 20 for each damage counter on itself', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new NsReshiram()], [CardType.FIRE, CardType.LIGHTNING]);
    player.active.damage = 30;
    sim.dispatch(new AttackAction(1, 'Powerful Rage'));
    expect(opponent.active.damage).toEqual(60);
  });

  it('N\'s Zekrom Shred ignores effects on the opponent\'s Active Pokémon', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new ShieldedPokemon()]);
    TestUtils.setActive(sim, [new NsZekrom()], [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Shred'));
    expect(opponent.active.damage).toEqual(70);
  });

  it('N\'s Zekrom Shred still triggers the defender\'s "when damaged" tools', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.active.trainers.cards = [new LuckyHelmet()];
    const deckBefore = opponent.deck.cards.length;
    TestUtils.setActive(sim, [new NsZekrom()], [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Shred'));
    expect(opponent.active.damage).toEqual(70);
    expect(opponent.deck.cards.length).toEqual(deckBefore - 3);
  });

  it('N\'s Zekrom Rampaging Thunder does 250, then it can\'t attack during your next turn', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new NsZekrom()],
      [CardType.FIRE, CardType.LIGHTNING, CardType.LIGHTNING, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Rampaging Thunder'));
    expect(opponent.active.damage).toEqual(250);
    sim.dispatch(new PassTurnAction(2));
    expect(() => sim.dispatch(new AttackAction(1, 'Shred'))).toThrow();
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new PassTurnAction(2));
    const again = TestUtils.getAll(sim).opponent;
    again.active.damage = 0;
    sim.dispatch(new AttackAction(1, 'Shred'));
    expect(again.active.damage).toEqual(70);
  });

  it('N\'s Zoroark ex Night Joker uses a Benched N\'s Pokémon\'s attack', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const reshiram = new NsReshiram();
    player.bench[0].pokemons.cards = [reshiram];
    player.bench[1].pokemons.cards = [new NsZoroarkEx()];
    player.bench[2].pokemons.cards = [new TestPokemon()];
    TestUtils.setActive(sim, [new NsZorua(), new NsZoroarkEx()], [CardType.DARK, CardType.DARK]);
    player.active.damage = 50;
    sim.dispatch(new AttackAction(1, 'Night Joker'));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseAttackPrompt;
    expect(prompt instanceof ChooseAttackPrompt).toBeTrue();
    // Only N's Pokémon are offered, and another Night Joker is blocked.
    expect(prompt.cards.map(c => c.name)).toEqual(['N\'s Reshiram', 'N\'s Zoroark ex']);
    expect(prompt.options.blocked).toEqual([{ index: 1, name: 'Night Joker' }]);
    // Powerful Rage counts the damage on the attacker, N's Zoroark ex.
    sim.dispatch(new ResolvePromptAction(prompt.id, reshiram.attacks[0]));
    expect(opponent.active.damage).toEqual(100);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
  });

  it('Night Joker does nothing without a Benched N\'s Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0].pokemons.cards = [new TestPokemon()];
    TestUtils.setActive(sim, [new NsZorua(), new NsZoroarkEx()], [CardType.DARK, CardType.DARK]);
    sim.dispatch(new AttackAction(1, 'Night Joker'));
    expect(TestUtils.lastPrompt(sim, player) instanceof ChooseAttackPrompt).toBeFalse();
    expect(opponent.active.damage).toEqual(0);
  });

  it('Night Joker copying Rampaging Thunder stops N\'s Zoroark ex attacking next turn', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const zekrom = new NsZekrom();
    player.bench[0].pokemons.cards = [zekrom];
    TestUtils.setActive(sim, [new NsZorua(), new NsZoroarkEx()], [CardType.DARK, CardType.DARK]);
    sim.dispatch(new AttackAction(1, 'Night Joker'));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseAttackPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, zekrom.attacks[1]));
    expect(opponent.active.damage).toEqual(250);
    sim.dispatch(new PassTurnAction(2));
    expect(() => sim.dispatch(new AttackAction(1, 'Night Joker'))).toThrow();
  });

  it('Trade discards a card to draw 2, once per turn for each N\'s Zoroark ex', () => {
    const { player } = TestUtils.getAll(sim);
    const [keep, toss] = TestUtils.makeTestCards(2);
    player.hand.cards = [keep, toss];
    player.bench[0].pokemons.cards = [new NsZorua(), new NsZoroarkEx()];
    const target = TestUtils.target(sim, player.bench[0]);
    sim.dispatch(new UseAbilityAction(1, 'Trade', target));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [toss]));
    expect(player.discard.cards).toEqual([toss]);
    expect(player.hand.cards.length).toEqual(3);
    expect(() => sim.dispatch(new UseAbilityAction(1, 'Trade', target))).toThrow();
  });

  it('Trade can\'t be used with an empty hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [];
    player.bench[0].pokemons.cards = [new NsZorua(), new NsZoroarkEx()];
    expect(() => sim.dispatch(new UseAbilityAction(1, 'Trade', TestUtils.target(sim, player.bench[0]))))
      .toThrow();
  });

  it('Pecharunt ex Subjugating Chains switches in a Benched D Pokémon and Poisons it', () => {
    const { player } = TestUtils.getAll(sim);
    const zorua = new NsZorua();
    TestUtils.setActive(sim, [new PecharuntEx()]);
    player.bench[0].pokemons.cards = [new PecharuntEx()];
    player.bench[1].pokemons.cards = [zorua];
    player.bench[2].pokemons.cards = [new TestPokemon()];
    sim.dispatch(new UseAbilityAction(1, 'Subjugating Chains', TestUtils.target(sim, player.active)));
    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    expect(prompt.options.blocked).toEqual([
      { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 },
      { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 2 },
      { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 3 },
      { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 4 },
    ]);
    sim.dispatch(new ResolvePromptAction(prompt.id, [player.bench[1]]));
    expect(player.active.getPokemonCard()).toBe(zorua);
    expect(player.active.specialConditions).toContain(SpecialCondition.POISONED);
    // Only one Subjugating Chains each turn, even from the other Pecharunt ex.
    expect(() => sim.dispatch(new UseAbilityAction(1, 'Subjugating Chains',
      TestUtils.target(sim, player.bench[0])))).toThrow();
  });

  it('Subjugating Chains needs a Benched D Pokémon other than Pecharunt ex', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new PecharuntEx()]);
    player.bench[0].pokemons.cards = [new PecharuntEx()];
    expect(() => sim.dispatch(new UseAbilityAction(1, 'Subjugating Chains',
      TestUtils.target(sim, player.active)))).toThrow();
  });

  it('Pecharunt ex Irritated Outburst does 60 for each Prize card the opponent has taken', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.prizes[0].cards = [];
    opponent.prizes[1].cards = [];
    TestUtils.setActive(sim, [new PecharuntEx()], [CardType.DARK, CardType.DARK]);
    sim.dispatch(new AttackAction(1, 'Irritated Outburst'));
    expect(opponent.active.damage).toEqual(120);
  });

  it('Tatsugiri Attract Customers finds a Supporter in the top 6, only from the Active Spot', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const judge = new Judge();
    const others = TestUtils.makeTestCards(5);
    player.deck.cards = [...others, judge, ...TestUtils.makeTestCards(5)];
    TestUtils.setActive(sim, [new Tatsugiri()]);
    sim.dispatch(new UseAbilityAction(1, 'Attract Customers', TestUtils.target(sim, player.active)));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt.cards.cards.length).toEqual(6);
    sim.dispatch(new ResolvePromptAction(prompt.id, [judge]));
    const show = TestUtils.lastPrompt(sim, opponent)!;
    sim.dispatch(new ResolvePromptAction(show.id, true));
    expect(player.hand.cards).toEqual([judge]);
    expect(player.deck.cards.length).toEqual(10);
    expect(() => sim.dispatch(new UseAbilityAction(1, 'Attract Customers',
      TestUtils.target(sim, player.active)))).toThrow();

    const benched = TestUtils.createTestSimulator();
    const p2 = TestUtils.getAll(benched).player;
    p2.bench[0].pokemons.cards = [new Tatsugiri()];
    expect(() => benched.dispatch(new UseAbilityAction(1, 'Attract Customers',
      TestUtils.target(benched, p2.bench[0])))).toThrow();
  });

  it('N\'s PP Up attaches a Basic Energy from the discard pile to a Benched N\'s Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    const [energy] = TestUtils.makeEnergies([CardType.DARK]);
    player.discard.cards = [energy];
    player.bench[0].pokemons.cards = [new TestPokemon()];
    player.bench[1].pokemons.cards = [new NsZorua()];
    player.hand.cards = [new NsPPUp()];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    const prompt = TestUtils.lastPrompt(sim, player) as AttachEnergyPrompt;
    expect(prompt.options.blockedTo.map(t => t.index)).toEqual([0, 2, 3, 4]);
    sim.dispatch(new ResolvePromptAction(prompt.id, [
      { to: { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 1 }, card: energy }
    ]));
    expect(player.bench[1].energies.cards).toEqual([energy]);
  });

  it('N\'s PP Up can\'t be played without a Benched N\'s Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    player.discard.cards = TestUtils.makeEnergies([CardType.DARK]);
    player.bench[0].pokemons.cards = [new TestPokemon()];
    player.hand.cards = [new NsPPUp()];
    expect(() => sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)))).toThrow();
  });

  it('Cyrano finds up to 3 Pokémon ex', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const ex1 = new TestEx();
    const ex2 = new NsZoroarkEx();
    const plain = new TestPokemon();
    player.deck.cards = [plain, ex1, ex2];
    player.hand.cards = [new Cyrano()];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt.options.blocked).toEqual([0]);
    expect(prompt.options.max).toEqual(3);
    sim.dispatch(new ResolvePromptAction(prompt.id, [ex1, ex2]));
    const show = TestUtils.lastPrompt(sim, opponent)!;
    sim.dispatch(new ResolvePromptAction(show.id, true));
    expect(player.hand.cards).toEqual([ex1, ex2]);
  });

  it('Brock\'s Scouting finds up to 2 Basic Pokémon or 1 Evolution Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const basic1 = new TestPokemon();
    const basic2 = new NsZorua();
    const evo = new Stage1Test();
    player.deck.cards = [basic1, evo, basic2];
    player.hand.cards = [new BrocksScouting()];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    const select = TestUtils.lastPrompt(sim, player) as SelectPrompt;
    expect(select instanceof SelectPrompt).toBeTrue();
    sim.dispatch(new ResolvePromptAction(select.id, 0));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect([prompt.options.max, prompt.options.blocked]).toEqual([2, [1]]);
    sim.dispatch(new ResolvePromptAction(prompt.id, [basic1, basic2]));
    const show = TestUtils.lastPrompt(sim, opponent)!;
    sim.dispatch(new ResolvePromptAction(show.id, true));
    expect(player.hand.cards).toEqual([basic1, basic2]);
  });

  it('Brock\'s Scouting, Evolution half, offers 1 Evolution Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    const evo = new Stage1Test();
    player.deck.cards = [new TestPokemon(), evo];
    player.hand.cards = [new BrocksScouting()];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    const select = TestUtils.lastPrompt(sim, player) as SelectPrompt;
    sim.dispatch(new ResolvePromptAction(select.id, 1));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect([prompt.options.max, prompt.options.blocked]).toEqual([1, [0]]);
  });

  it('Janine\'s Secret Art attaches Basic D Energy to up to 2 D Pokémon and Poisons the Active one', () => {
    const { player } = TestUtils.getAll(sim);
    const energies = TestUtils.makeEnergies([CardType.DARK, CardType.DARK, CardType.DARK]);
    player.deck.cards = [...energies];
    TestUtils.setActive(sim, [new DarkTestPokemon()]);
    player.bench[0].pokemons.cards = [new TestPokemon()];
    player.bench[1].pokemons.cards = [new NsZorua()];
    player.hand.cards = [new JaninesSecretArt()];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    const prompt = TestUtils.lastPrompt(sim, player) as AttachEnergyPrompt;
    expect(prompt.options.differentTargets).toBeTrue();
    expect(prompt.options.blockedTo).toContain({ player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 });
    sim.dispatch(new ResolvePromptAction(prompt.id, [
      { to: { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 }, card: energies[0] },
      { to: { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 1 }, card: energies[1] },
    ]));
    expect(player.active.energies.cards).toEqual([energies[0]]);
    expect(player.bench[1].energies.cards).toEqual([energies[1]]);
    expect(player.active.specialConditions).toContain(SpecialCondition.POISONED);
    expect(player.deck.cards.length).toEqual(1);
  });

  it('Janine\'s Secret Art on the Bench only does not Poison the Active Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    const energies = TestUtils.makeEnergies([CardType.DARK]);
    player.deck.cards = [...energies];
    TestUtils.setActive(sim, [new DarkTestPokemon()]);
    player.bench[0].pokemons.cards = [new NsZorua()];
    player.hand.cards = [new JaninesSecretArt()];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    const prompt = TestUtils.lastPrompt(sim, player) as AttachEnergyPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [
      { to: { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 }, card: energies[0] },
    ]));
    expect(player.active.specialConditions).not.toContain(SpecialCondition.POISONED);
  });

  it('Black Belt\'s Training: +40 to the opponent\'s Active Pokémon ex this turn only', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestEx()]);
    player.hand.cards = [new BlackBeltsTraining()];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new AttackAction(1, 'Test attack'));
    expect(opponent.active.damage).toEqual(50);
    sim.dispatch(new PassTurnAction(2));
    const again = TestUtils.getAll(sim).opponent;
    sim.dispatch(new AttackAction(1, 'Test attack'));
    expect(again.active.damage).toEqual(60);
  });

  it('Black Belt\'s Training does not boost damage to a Pokémon that is not ex', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.hand.cards = [new BlackBeltsTraining()];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new AttackAction(1, 'Test attack'));
    expect(opponent.active.damage).toEqual(10);
  });

  it('Secret Box discards 3 cards and finds an Item, a Tool, a Supporter and a Stadium', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const box = new SecretBox();
    const costs = TestUtils.makeTestCards(3);
    const item = new BuddyBuddyPoffin();
    const tool = new AirBalloon();
    const supporter = new Judge();
    const stadium = new TeamRocketsWatchtower();
    player.deck.cards = [stadium, supporter, tool, item];
    player.hand.cards = [box, ...costs];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    let prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, costs));
    for (const card of [item, tool, supporter, stadium]) {
      prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
      sim.dispatch(new ResolvePromptAction(prompt.id, [card]));
    }
    const show = TestUtils.lastPrompt(sim, opponent)!;
    sim.dispatch(new ResolvePromptAction(show.id, true));
    expect(player.hand.cards).toEqual([item, tool, supporter, stadium]);
    expect(player.discard.cards).toEqual([box, ...costs]);
  });

  it('Secret Box needs 3 other cards in the hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [new SecretBox(), ...TestUtils.makeTestCards(2)];
    expect(() => sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)))).toThrow();
  });

  it('Air Balloon makes the Retreat Cost 2 Colorless less', () => {
    const { player } = TestUtils.getAll(sim);
    const zekrom = new NsZekrom();
    TestUtils.setActive(sim, [zekrom], [], [new AirBalloon()]);
    const effect = new CheckRetreatCostEffect(player);
    sim.store.reduceEffect(sim.store.state, effect);
    expect(effect.cost).toEqual([]);
    TestUtils.setActive(sim, [zekrom]);
    const without = new CheckRetreatCostEffect(player);
    sim.store.reduceEffect(sim.store.state, without);
    expect(without.cost.length).toEqual(2);
  });

  it('Binding Mochi: +40 while the attacker is Poisoned', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TestPokemon()], [], [new BindingMochi()]);
    player.active.addSpecialCondition(SpecialCondition.POISONED);
    sim.dispatch(new AttackAction(1, 'Test attack'));
    expect(opponent.active.damage).toEqual(50);
  });

  it('Binding Mochi does nothing while the attacker is not Poisoned', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TestPokemon()], [], [new BindingMochi()]);
    sim.dispatch(new AttackAction(1, 'Test attack'));
    expect(opponent.active.damage).toEqual(10);
  });

  it('Punk Helmet puts 4 damage counters on the Attacking Pokémon when its D Pokémon is damaged', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new DarkTestPokemon()], [], [new PunkHelmet()]);
    sim.dispatch(new AttackAction(1, 'Test attack'));
    expect(player.active.damage).toEqual(40);
  });

  it('Punk Helmet does nothing on a Pokémon that is not D', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestPokemon()], [], [new PunkHelmet()]);
    sim.dispatch(new AttackAction(1, 'Test attack'));
    expect(player.active.damage).toEqual(0);
  });
});
