import {
  AddSpecialConditionsEffect,
  AttackAction,
  AttackEffect,
  CardTag,
  CardType,
  CheckHpEffect,
  ChooseAttackPrompt,
  ChooseCardsPrompt,
  ChoosePokemonPrompt,
  ChoosePrizePrompt,
  GameMessage,
  GamePhase,
  PlayCardAction,
  PutDamageEffect,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
  Stage,
  UseAbilityAction,
} from '@ptcg/common';

import { Applin } from '../../../src/standard/set-twilight-masquerade/applin';
import { ApplinDragon } from '../../../src/standard/set-twilight-masquerade/applin-dragon';
import { Dipplin } from '../../../src/standard/set-twilight-masquerade/dipplin';
import { Grookey } from '../../../src/standard/set-twilight-masquerade/grookey';
import { Thwackey } from '../../../src/standard/set-twilight-masquerade/thwackey';
import { Goldeen } from '../../../src/standard/set-twilight-masquerade/goldeen';
import { FestivalGrounds } from '../../../src/standard/set-twilight-masquerade/festival-grounds';
import { LanasAid } from '../../../src/standard/set-twilight-masquerade/lanas-aid';
import { SeakingPRE } from '../../../src/standard/set-prismatic-evolutions/seaking';
import { Rellor } from '../../../src/standard/set-temporal-forces/rellor';
import { Rabsca } from '../../../src/standard/set-temporal-forces/rabsca';
import { ShayminDRI } from '../../../src/standard/set-destined-rivals/shaymin';
import { GladionsFinalBattle } from '../../../src/standard/set-pitch-black/gladions-final-battle';
import { BraveBangle } from '../../../src/standard/set-white-flare/brave-bangle';
import { GrowingGrassEnergy } from '../../../src/standard/set-perfect-order/growing-grass-energy';
import { GrassEnergy } from '../../../src/standard/set-diamond-and-pearl/grass-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class TestEx extends TestPokemon {
  public tags = [CardTag.POKEMON_EX];
  public name = 'Test ex';
  public fullName = 'Test ex TEST';
}

describe('Festival Lead deck cards', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  function setFestivalGrounds() {
    const { player } = TestUtils.getAll(sim);
    player.stadium.cards = [new FestivalGrounds()];
  }

  function benchTwo() {
    const { player } = TestUtils.getAll(sim);
    player.bench[0].pokemons.cards = [new TestPokemon()];
    player.bench[1].pokemons.cards = [new TestPokemon()];
  }

  function isOpponentsTurn(): boolean {
    const { state } = TestUtils.getAll(sim);
    return state.activePlayer === 1 && state.phase === GamePhase.PLAYER_TURN;
  }

  it('Should have the printed stats', () => {
    const fire = [{ type: CardType.FIRE }];
    const lightning = [{ type: CardType.LIGHTNING }];

    const applin = new Applin();
    expect([applin.hp, applin.stage, applin.cardTypes, applin.weakness, applin.retreat.length])
      .toEqual([40, Stage.BASIC, [CardType.GRASS], fire, 1]);
    const dragon = new ApplinDragon();
    expect([dragon.hp, dragon.cardTypes, dragon.weakness, dragon.retreat.length, dragon.name])
      .toEqual([40, [CardType.DRAGON], [], 1, 'Applin']);
    expect(dragon.attacks[1].cost).toEqual([CardType.GRASS, CardType.FIRE]);
    const dipplin = new Dipplin();
    expect([dipplin.hp, dipplin.stage, dipplin.evolvesFrom, dipplin.weakness, dipplin.retreat.length])
      .toEqual([80, Stage.STAGE_1, 'Applin', fire, 2]);
    const grookey = new Grookey();
    expect([grookey.hp, grookey.weakness, grookey.retreat.length]).toEqual([70, fire, 1]);
    const thwackey = new Thwackey();
    expect([thwackey.hp, thwackey.evolvesFrom, thwackey.weakness, thwackey.retreat.length])
      .toEqual([100, 'Grookey', fire, 2]);
    const goldeen = new Goldeen();
    expect([goldeen.hp, goldeen.cardTypes, goldeen.weakness, goldeen.retreat.length])
      .toEqual([50, [CardType.WATER], lightning, 1]);
    const seaking = new SeakingPRE();
    expect([seaking.hp, seaking.evolvesFrom, seaking.weakness, seaking.retreat.length])
      .toEqual([110, 'Goldeen', lightning, 1]);
    const rellor = new Rellor();
    expect([rellor.hp, rellor.weakness, rellor.retreat.length]).toEqual([50, fire, 1]);
    const rabsca = new Rabsca();
    expect([rabsca.hp, rabsca.evolvesFrom, rabsca.weakness, rabsca.retreat.length]).toEqual([70, 'Rellor', fire, 1]);
    const shaymin = new ShayminDRI();
    expect([shaymin.hp, shaymin.weakness, shaymin.retreat.length]).toEqual([80, fire, 1]);
  });

  it('Festival Lead: without Festival Grounds, Dipplin attacks once and the turn ends', () => {
    const { opponent } = TestUtils.getAll(sim);
    benchTwo();
    TestUtils.setActive(sim, [new Applin(), new Dipplin()], [CardType.GRASS]);
    sim.dispatch(new AttackAction(1, 'Do the Wave'));
    expect(opponent.active.damage).toEqual(40);
    expect(isOpponentsTurn()).toBeTrue();
  });

  it('Festival Lead: with Festival Grounds, Dipplin may attack a second time', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    benchTwo();
    setFestivalGrounds();
    TestUtils.setActive(sim, [new Applin(), new Dipplin()], [CardType.GRASS]);
    sim.dispatch(new AttackAction(1, 'Do the Wave'));
    expect(opponent.active.damage).toEqual(40);
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseAttackPrompt;
    expect(prompt instanceof ChooseAttackPrompt).toBeTrue();
    expect(prompt.message).toEqual(GameMessage.CHOOSE_ATTACK_TO_USE_AGAIN);
    expect(prompt.options.allowCancel).toBeTrue();
    expect(isOpponentsTurn()).toBeFalse();
    sim.dispatch(new ResolvePromptAction(prompt.id, prompt.cards[0].attacks[0]));
    expect(opponent.active.damage).toEqual(80);
    expect(isOpponentsTurn()).toBeTrue();
  });

  it('Festival Lead: cancelling the second attack ends the turn', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    benchTwo();
    setFestivalGrounds();
    TestUtils.setActive(sim, [new Applin(), new Dipplin()], [CardType.GRASS]);
    sim.dispatch(new AttackAction(1, 'Do the Wave'));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseAttackPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, null));
    expect(opponent.active.damage).toEqual(40);
    expect(isOpponentsTurn()).toBeTrue();
  });

  it('Festival Lead: after a Knock Out, Prizes and a new Active come first, then the second attack', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    benchTwo();
    setFestivalGrounds();
    const next = new TestPokemon();
    opponent.bench[0].pokemons.cards = [next];
    opponent.active.damage = 360;
    TestUtils.setActive(sim, [new Applin(), new Dipplin()], [CardType.GRASS]);
    sim.dispatch(new AttackAction(1, 'Do the Wave'));

    const prize = TestUtils.lastPrompt(sim, player) as ChoosePrizePrompt;
    expect(prize instanceof ChoosePrizePrompt).toBeTrue();
    sim.dispatch(new ResolvePromptAction(prize.id, player.prizes.slice(0, 1)));
    const choose = TestUtils.lastPrompt(sim, opponent) as ChoosePokemonPrompt;
    expect(choose instanceof ChoosePokemonPrompt).toBeTrue();
    sim.dispatch(new ResolvePromptAction(choose.id, [opponent.bench[0]]));
    expect(opponent.active.getPokemonCard()).toBe(next);

    const again = TestUtils.lastPrompt(sim, player) as ChooseAttackPrompt;
    expect(again instanceof ChooseAttackPrompt).toBeTrue();
    sim.dispatch(new ResolvePromptAction(again.id, again.cards[0].attacks[0]));
    expect(opponent.active.damage).toEqual(40);
    expect(player.getPrizeLeft()).toEqual(5);
    expect(isOpponentsTurn()).toBeTrue();
  });

  it('Goldeen Whirlpool needs 2 Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    setFestivalGrounds();
    // Goldeen's Whirlpool needs 2 Energy; the second attack is not offered without them.
    TestUtils.setActive(sim, [new Goldeen()], [CardType.COLORLESS]);
    expect(() => sim.dispatch(new AttackAction(1, 'Whirlpool'))).toThrow();
    expect(opponent.active.damage).toEqual(0);
  });

  it('Goldeen Whirlpool discards an Energy from the opponent\'s Active on heads, twice with Festival Grounds', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    setFestivalGrounds();
    TestUtils.setDefending(sim, [new TestPokemon()], [CardType.GRASS, CardType.FIRE]);
    TestUtils.setActive(sim, [new Goldeen()], [CardType.WATER, CardType.WATER]);
    sim.dispatch(new AttackAction(1, 'Whirlpool'));
    let discard = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(discard.id, [opponent.active.energies.cards[0]]));
    expect(opponent.active.energies.cards.length).toEqual(1);
    const again = TestUtils.lastPrompt(sim, player) as ChooseAttackPrompt;
    sim.dispatch(new ResolvePromptAction(again.id, again.cards[0].attacks[0]));
    discard = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(discard.id, [opponent.active.energies.cards[0]]));
    expect(opponent.active.energies.cards.length).toEqual(0);
    expect(opponent.active.damage).toEqual(20);
    expect(isOpponentsTurn()).toBeTrue();
  });

  it('Seaking Rapid Draw does 60 and draws 2 cards', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Goldeen(), new SeakingPRE()], [CardType.WATER]);
    sim.dispatch(new AttackAction(1, 'Rapid Draw'));
    expect(opponent.active.damage).toEqual(60);
    expect(player.hand.cards.length).toEqual(2);
  });

  it('Thwackey Boom Boom Groove searches the deck only with a Festival Lead Pokémon Active, once a turn', () => {
    const setup = (activeHasFestivalLead: boolean) => {
      const s2 = TestUtils.createTestSimulator();
      const { player } = TestUtils.getAll(s2);
      const cards = TestUtils.makeTestCards(5);
      player.deck.cards = cards;
      player.bench[0].pokemons.cards = [new Grookey(), new Thwackey()];
      if (activeHasFestivalLead) {
        TestUtils.setActive(s2, [new Applin(), new Dipplin()]);
      }
      const use = () => s2.dispatch(new UseAbilityAction(1, 'Boom Boom Groove', TestUtils.target(s2, player.bench[0])));
      return { s2, player, cards, use };
    };

    expect(setup(false).use).toThrow();

    const { s2, player, cards, use } = setup(true);
    use();
    const prompt = TestUtils.lastPrompt(s2, player) as ChooseCardsPrompt;
    s2.dispatch(new ResolvePromptAction(prompt.id, [cards[3]]));
    expect(player.hand.cards).toEqual([cards[3]]);
    expect(player.deck.cards.length).toEqual(4);
    expect(use).toThrow();
  });

  it('Festival Grounds: Pokémon with Energy can\'t get Special Conditions and recover from them', () => {
    const { state, player, opponent } = TestUtils.getAll(sim);
    setFestivalGrounds();
    TestUtils.setDefending(sim, [new TestPokemon()], [CardType.GRASS]);
    const attack = new AttackEffect(player, opponent, player.active.getPokemonCard()!.attacks[0]);
    const poison = new AddSpecialConditionsEffect(attack, [SpecialCondition.POISONED]);
    sim.store.reduceEffect(state, poison);
    expect(opponent.active.specialConditions).toEqual([]);

    // No Energy: affected as usual.
    player.active.addSpecialCondition(SpecialCondition.ASLEEP);
    sim.store.reduceEffect(state, new CheckHpEffect(player, player.active));
    expect(player.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
    // Energy attached: recovers.
    player.active.energies.cards.push(new GrassEnergy());
    sim.store.reduceEffect(state, new CheckHpEffect(player, player.active));
    expect(player.active.specialConditions).toEqual([]);
  });

  it('Rabsca Spherical Shield prevents damage and effects of the opponent\'s attacks on the Bench', () => {
    const { state, player, opponent } = TestUtils.getAll(sim);
    player.bench[0].pokemons.cards = [new Rellor(), new Rabsca()];
    player.bench[1].pokemons.cards = [new TestPokemon()];
    const attack = new AttackEffect(opponent, player, opponent.active.getPokemonCard()!.attacks[0]);
    const put = new PutDamageEffect(attack, 30);
    put.target = player.bench[1];
    sim.store.reduceEffect(state, put);
    expect(player.bench[1].damage).toEqual(0);
    // The Active Pokémon is not protected.
    const active = new PutDamageEffect(attack, 30);
    active.target = player.active;
    sim.store.reduceEffect(state, active);
    expect(player.active.damage).toEqual(30);
  });

  it('Rabsca Psychic does 30 more for each Energy on the opponent\'s Active', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestPokemon()], [CardType.GRASS, CardType.FIRE]);
    TestUtils.setActive(sim, [new Rellor(), new Rabsca()], [CardType.GRASS]);
    sim.dispatch(new AttackAction(1, 'Psychic'));
    expect(opponent.active.damage).toEqual(70);
  });

  it('Shaymin Flower Curtain protects Benched Pokémon without a Rule Box from damage', () => {
    const { state, player, opponent } = TestUtils.getAll(sim);
    player.bench[0].pokemons.cards = [new ShayminDRI()];
    player.bench[1].pokemons.cards = [new TestPokemon()];
    player.bench[2].pokemons.cards = [new TestEx()];
    const attack = new AttackEffect(opponent, player, opponent.active.getPokemonCard()!.attacks[0]);
    [1, 2].forEach(i => {
      const put = new PutDamageEffect(attack, 30);
      put.target = player.bench[i];
      sim.store.reduceEffect(state, put);
    });
    expect(player.bench[1].damage).toEqual(0);
    expect(player.bench[2].damage).toEqual(30);
  });

  it('Rellor Slight Intrusion does 30 and 10 to itself', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Rellor()], [CardType.GRASS]);
    sim.dispatch(new AttackAction(1, 'Slight Intrusion'));
    expect(opponent.active.damage).toEqual(30);
    expect(player.active.damage).toEqual(10);
  });

  it('Applin Tumbling Attack does 30 on heads; Applin (Dragon) Find a Friend finds a Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Applin()], [CardType.GRASS]);
    sim.dispatch(new AttackAction(1, 'Tumbling Attack'));
    expect(opponent.active.damage).toEqual(30);

    const sim2 = TestUtils.createTestSimulator();
    const p2 = TestUtils.getAll(sim2).player;
    const dipplin = new Dipplin();
    p2.deck.cards = [...TestUtils.makeTestCards(3), dipplin];
    TestUtils.setActive(sim2, [new ApplinDragon()], [CardType.COLORLESS]);
    sim2.dispatch(new AttackAction(1, 'Find a Friend'));
    const prompt = TestUtils.lastPrompt(sim2, p2) as ChooseCardsPrompt;
    sim2.dispatch(new ResolvePromptAction(prompt.id, [dipplin]));
    expect(p2.hand.cards).toEqual([dipplin]);
    expect(player.hand.cards).toEqual([]);
  });

  it('Lana\'s Aid puts up to 3 Pokémon without a Rule Box or Basic Energy from the discard pile into the hand', () => {
    const { player } = TestUtils.getAll(sim);
    const applin = new Applin();
    const energy = new GrassEnergy();
    const ex = new TestEx();
    const growing = new GrowingGrassEnergy();
    player.discard.cards = [applin, ex, energy, growing];
    player.hand.cards = [new LanasAid()];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt.options.max).toEqual(3);
    expect(prompt.options.blocked).toEqual([1, 3]);
    sim.dispatch(new ResolvePromptAction(prompt.id, [applin, energy]));
    expect(player.hand.cards).toEqual([applin, energy]);
  });

  it('Gladion\'s Final Battle: only as the last card in hand; +80 for attackers without a Rule Box', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.hand.cards = [new GladionsFinalBattle()];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    TestUtils.setActive(sim, [new Rellor()], [CardType.GRASS]);
    sim.dispatch(new AttackAction(1, 'Slight Intrusion'));
    expect(opponent.active.damage).toEqual(110);
    // Not to itself.
    expect(player.active.damage).toEqual(10);

    const sim2 = TestUtils.createTestSimulator();
    TestUtils.getAll(sim2).player.hand.cards = [new GladionsFinalBattle(), new Applin()];
    expect(() => sim2.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim2)))).toThrow();
  });

  it('Gladion\'s Final Battle does nothing for a Pokémon with a Rule Box', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.hand.cards = [new GladionsFinalBattle()];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    TestUtils.setActive(sim, [new TestEx()]);
    sim.dispatch(new AttackAction(1, 'Test attack'));
    expect(opponent.active.damage).toEqual(10);
  });

  it('Brave Bangle: +30 to the opponent\'s Active Pokémon ex, only for an attacker without a Rule Box', () => {
    const damageTo = (attackerTags: string[], defender: TestPokemon) => {
      const sim2 = TestUtils.createTestSimulator();
      const all = TestUtils.getAll(sim2);
      const attacker = new TestPokemon();
      attacker.tags = attackerTags;
      TestUtils.setActive(sim2, [attacker], [], [new BraveBangle()]);
      TestUtils.setDefending(sim2, [defender]);
      sim2.dispatch(new AttackAction(1, 'Test attack'));
      return all.opponent.active.damage;
    };
    expect(damageTo([], new TestEx())).toEqual(40);
    expect(damageTo([], new TestPokemon())).toEqual(10);
    expect(damageTo([CardTag.POKEMON_EX], new TestEx())).toEqual(10);
  });

  it('Growing Grass Energy provides G and gives a G Pokémon +20 HP', () => {
    const { state, player } = TestUtils.getAll(sim);
    const growing = new GrowingGrassEnergy();
    expect(growing.provides).toEqual([CardType.GRASS]);
    TestUtils.setActive(sim, [new Applin()]);
    player.active.energies.cards = [growing];
    const check = new CheckHpEffect(player, player.active);
    sim.store.reduceEffect(state, check);
    expect(check.hp).toEqual(60);

    TestUtils.setActive(sim, [new Goldeen()]);
    player.active.energies.cards = [growing];
    const check2 = new CheckHpEffect(player, player.active);
    sim.store.reduceEffect(state, check2);
    expect(check2.hp).toEqual(50);
  });
});
