import {
  AttackAction,
  AttackEffect,
  CardTag,
  CardType,
  CheckAttackCostEffect,
  CheckProvidedEnergyEffect,
  ChooseCardsPrompt,
  ChoosePokemonPrompt,
  GameError,
  GameMessage,
  GamePhase,
  KnockOutEffect,
  PassTurnAction,
  PlayCardAction,
  PlayerType,
  PokemonCard,
  PowerEffect,
  PowerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
  SpecialCondition,
  Stage,
  State,
  StateUtils,
  StoreLike,
  Effect,
  AddSpecialConditionsEffect,
  UseAbilityAction,
} from '@ptcg/common';

import { Poltchageist } from '../../../src/standard/set-pitch-black/poltchageist';
import { Sinistcha } from '../../../src/standard/set-pitch-black/sinistcha';
import { Shuppet } from '../../../src/standard/set-pitch-black/shuppet';
import { Banette } from '../../../src/standard/set-pitch-black/banette';
import { Dhelmise } from '../../../src/standard/set-pitch-black/dhelmise';
import { Gwynn } from '../../../src/standard/set-pitch-black/gwynn';
import { HideNSneak } from '../../../src/standard/set-pitch-black/hide-n-sneak';
import { ExplorersGuidance } from '../../../src/standard/set-temporal-forces/explorers-guidance';
import { BloodmoonUrsalunaEx } from '../../../src/standard/set-twilight-masquerade/bloodmoon-ursaluna-ex';
import { LegacyEnergy } from '../../../src/standard/set-twilight-masquerade/legacy-energy';
import { Munkidori } from '../../../src/standard/set-twilight-masquerade/munkidori';
import { Duskull } from '../../../src/standard/set-prismatic-evolutions/duskull';
import { Dusclops } from '../../../src/standard/set-prismatic-evolutions/dusclops';
import { LatiasEx } from '../../../src/standard/set-surging-sparks/latias-ex';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

/** An attacker whose attack Confuses and puts 2 damage counters on the Defending Pokémon. */
class Confuser extends TestPokemon {
  public attacks = [{ name: 'Confuse', cost: [], damage: '10', text: '' }];
  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      store.reduceEffect(state, new AddSpecialConditionsEffect(effect, [SpecialCondition.CONFUSED]));
    }
    return state;
  }
}

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

describe('Dhelmise deck cards', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  function hideNSneakDiscard(count: number): PokemonCard[] {
    const all = [new Poltchageist(), new Sinistcha(), new Shuppet(), new Banette()];
    return Array.from({ length: count }, (_, i) => {
      const card = all[i % all.length];
      return new (card.constructor as { new(): PokemonCard })();
    });
  }

  it('Should have the printed stats', () => {
    const dark = [{ type: CardType.DARK }];
    const fightingResistance = [{ type: CardType.FIGHTING, value: -30 }];
    const fire = [{ type: CardType.FIRE }];

    const polt = new Poltchageist();
    expect([polt.hp, polt.stage, polt.cardTypes, polt.weakness, polt.resistance, polt.retreat.length])
      .toEqual([30, Stage.BASIC, [CardType.GRASS], fire, [], 0]);
    expect(polt.attacks[0].cost).toEqual([CardType.COLORLESS]);
    const sin = new Sinistcha();
    expect([sin.hp, sin.stage, sin.evolvesFrom, sin.cardTypes, sin.weakness, sin.retreat.length])
      .toEqual([60, Stage.STAGE_1, 'Poltchageist', [CardType.GRASS], fire, 1]);
    const shuppet = new Shuppet();
    expect([shuppet.hp, shuppet.cardTypes, shuppet.weakness, shuppet.resistance, shuppet.retreat.length])
      .toEqual([50, [CardType.PSYCHIC], dark, fightingResistance, 1]);
    const banette = new Banette();
    expect([banette.hp, banette.evolvesFrom, banette.cardTypes, banette.weakness, banette.resistance,
      banette.retreat.length]).toEqual([80, 'Shuppet', [CardType.PSYCHIC], dark, fightingResistance, 1]);
    [polt, sin, shuppet, banette].forEach(c => expect(c.powers.map(p => p.name)).toEqual(['Hide \'n\' Sneak']));
    const dhelmise = new Dhelmise();
    expect([dhelmise.hp, dhelmise.cardTypes, dhelmise.weakness, dhelmise.resistance, dhelmise.retreat.length,
      dhelmise.powers.length, dhelmise.attacks[0].cost]).toEqual([140, [CardType.PSYCHIC], dark,
      fightingResistance, 3, 0, [CardType.PSYCHIC]]);
    const ursaluna = new BloodmoonUrsalunaEx();
    expect([ursaluna.hp, ursaluna.cardTypes, ursaluna.weakness, ursaluna.retreat.length, ursaluna.tags])
      .toEqual([260, [CardType.COLORLESS], [{ type: CardType.FIGHTING }], 3, [CardTag.POKEMON_EX]]);
    expect(ursaluna.attacks[0].cost.length).toEqual(5);
    expect(new LegacyEnergy().tags).toEqual([CardTag.ACE_SPEC]);
  });

  it('Vengeful Anchor does 30, or 170 with 4 Hide \'n\' Sneak Pokémon in the discard pile', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Dhelmise()], [CardType.PSYCHIC]);
    player.discard.cards = [...hideNSneakDiscard(3), new Dhelmise()];
    sim.dispatch(new AttackAction(1, 'Vengeful Anchor'));
    expect(opponent.active.damage).toEqual(30);

    sim = TestUtils.createTestSimulator();
    const all = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Dhelmise()], [CardType.PSYCHIC]);
    all.player.discard.cards = hideNSneakDiscard(4);
    sim.dispatch(new AttackAction(1, 'Vengeful Anchor'));
    expect(all.opponent.active.damage).toEqual(170);
  });

  it('Furtive Drop places 1 damage counter on the opponent\'s Active Pokémon', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Poltchageist()], [CardType.GRASS]);
    sim.dispatch(new AttackAction(1, 'Furtive Drop'));
    expect(opponent.active.damage).toEqual(10);
  });

  it('Matcha Spin needs 6 Hide \'n\' Sneak Pokémon in the discard pile, then places 4 counters on each', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Poltchageist(), new Sinistcha()], [CardType.GRASS]);
    opponent.bench[0].pokemons.cards = [new TestPokemon()];
    opponent.bench[1].pokemons.cards = [new Shuppet()];
    player.discard.cards = hideNSneakDiscard(5);
    sim.dispatch(new AttackAction(1, 'Matcha Spin'));
    expect(opponent.active.damage).toEqual(0);

    sim = TestUtils.createTestSimulator();
    const all = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Poltchageist(), new Sinistcha()], [CardType.GRASS]);
    all.opponent.bench[0].pokemons.cards = [new TestPokemon()];
    all.opponent.bench[1].pokemons.cards = [new Shuppet()];
    all.player.discard.cards = hideNSneakDiscard(6);
    sim.dispatch(new AttackAction(1, 'Matcha Spin'));
    expect(all.opponent.active.damage).toEqual(40);
    expect(all.opponent.bench[0].damage).toEqual(40);
    // The opponent's Shuppet has Hide 'n' Sneak: counters are an effect, not damage.
    expect(all.opponent.bench[1].damage).toEqual(0);
  });

  it('Hide \'n\' Sneak prevents attack effects but not damage', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new Shuppet(), new Banette()]);
    TestUtils.setActive(sim, [new Confuser()]);
    sim.dispatch(new AttackAction(1, 'Confuse'));
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).not.toContain(SpecialCondition.CONFUSED);
  });

  it('Hide \'n\' Sneak is off under an Ability lock', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0].pokemons.cards = [new AbilityLock()];
    TestUtils.setDefending(sim, [new Shuppet()]);
    TestUtils.setActive(sim, [new Confuser()]);
    sim.dispatch(new AttackAction(1, 'Confuse'));
    expect(opponent.active.specialConditions).toContain(SpecialCondition.CONFUSED);
  });

  it('Hide \'n\' Sneak Pokémon can\'t be chosen for Cursed Blast', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0].pokemons.cards = [new Duskull(), new Dusclops()];
    opponent.active.pokemons.cards = [new Shuppet()];
    opponent.bench[0].pokemons.cards = [new TestPokemon()];
    sim.dispatch(new UseAbilityAction(1, 'Cursed Blast', TestUtils.target(sim, player.bench[0])));
    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    expect(prompt.options.blocked).toEqual([{ player: PlayerType.TOP_PLAYER, slot: SlotType.ACTIVE, index: 0 }]);
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[0]]));
    expect(opponent.bench[0].damage).toEqual(50);
  });

  it('Cursed Blast can\'t be used when every opponent\'s Pokémon has Hide \'n\' Sneak', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0].pokemons.cards = [new Duskull(), new Dusclops()];
    opponent.active.pokemons.cards = [new Shuppet()];
    expect(() => sim.dispatch(new UseAbilityAction(1, 'Cursed Blast', TestUtils.target(sim, player.bench[0]))))
      .toThrowMatching((e: GameError) => e.message === GameMessage.CANNOT_USE_POWER);
    expect(TestUtils.getAll(sim).player.bench[0].pokemons.cards.length).toEqual(2);
  });

  it('Adrena-Brain can\'t move damage counters to a Hide \'n\' Sneak Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Munkidori()], [CardType.DARK]);
    player.active.damage = 30;
    opponent.active.pokemons.cards = [new Banette()];
    expect(() => sim.dispatch(new UseAbilityAction(1, 'Adrena-Brain', TestUtils.target(sim, player.active))))
      .toThrowMatching((e: GameError) => e.message === GameMessage.CANNOT_USE_POWER);

    // A rejected action restores the state from a copy, so read it again.
    const again = TestUtils.getAll(sim);
    again.opponent.bench[0].pokemons.cards = [new TestPokemon()];
    sim.dispatch(new UseAbilityAction(1, 'Adrena-Brain', TestUtils.target(sim, again.player.active)));
    let prompt = TestUtils.lastPrompt(sim, again.player) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [again.player.active]));
    prompt = TestUtils.lastPrompt(sim, again.player) as ChoosePokemonPrompt;
    expect(prompt.options.blocked).toEqual([{ player: PlayerType.TOP_PLAYER, slot: SlotType.ACTIVE, index: 0 }]);
  });

  it('Puppet Pull does 80 and may put any card from the deck into the hand', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Shuppet(), new Banette()], [CardType.PSYCHIC]);
    const wanted = player.deck.cards[10];
    const deckSize = player.deck.cards.length;
    sim.dispatch(new AttackAction(1, 'Puppet Pull'));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt.options.min).toEqual(0);
    sim.dispatch(new ResolvePromptAction(prompt.id, [wanted]));
    expect(opponent.active.damage).toEqual(80);
    expect(player.hand.cards.indexOf(wanted)).not.toEqual(-1);
    expect(player.deck.cards.indexOf(wanted)).toEqual(-1);
    expect(player.deck.cards.length).toEqual(deckSize - 1);
  });

  it('Gwynn discards up to 2 Pokémon without a Rule Box and draws 3 for each', () => {
    const { player } = TestUtils.getAll(sim);
    const gwynn = new Gwynn();
    const shuppet = new Shuppet();
    const banette = new Banette();
    const latias = new LatiasEx();
    player.hand.cards = [gwynn, shuppet, latias, banette];
    sim.dispatch(new PlayCardAction(1, 0, { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.HAND, index: 0 }));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt.options.max).toEqual(2);
    expect(prompt.options.blocked).toEqual([0, 2]);
    sim.dispatch(new ResolvePromptAction(prompt.id, [shuppet, banette]));
    expect(player.discard.cards).toContain(shuppet);
    expect(player.discard.cards).toContain(banette);
    expect(player.hand.cards.length).toEqual(1 + 6);
  });

  it('Gwynn can\'t be played without a Pokémon to discard', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [new Gwynn(), new LatiasEx()];
    expect(() => sim.dispatch(new PlayCardAction(1, 0, { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.HAND,
      index: 0 }))).toThrowMatching((e: GameError) => e.message === GameMessage.CANNOT_PLAY_THIS_CARD);
  });

  it('Explorer\'s Guidance puts 2 of the top 6 into the hand and discards the other 4', () => {
    const { player } = TestUtils.getAll(sim);
    const deckSize = player.deck.cards.length;
    const top = player.deck.cards.slice(0, 6);
    player.hand.cards = [new ExplorersGuidance()];
    sim.dispatch(new PlayCardAction(1, 0, { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.HAND, index: 0 }));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect([prompt.options.min, prompt.options.max]).toEqual([2, 2]);
    sim.dispatch(new ResolvePromptAction(prompt.id, [top[1], top[4]]));
    expect(player.hand.cards).toEqual([top[1], top[4]]);
    [0, 2, 3, 5].forEach(i => expect(player.discard.cards).toContain(top[i]));
    expect(player.deck.cards.length).toEqual(deckSize - 6);
  });

  it('Seasoned Skill: Blood Moon costs C less for each Prize card the opponent has taken', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const ursaluna = new BloodmoonUrsalunaEx();
    TestUtils.setActive(sim, [ursaluna]);
    const cost = () => {
      const check = new CheckAttackCostEffect(player, ursaluna.attacks[0]);
      sim.store.reduceEffect(sim.store.state, check);
      return check.cost.length;
    };
    expect(cost()).toEqual(5);
    opponent.prizes[0].cards = [];
    opponent.prizes[1].cards = [];
    expect(cost()).toEqual(3);
    opponent.prizes.forEach(p => { p.cards = []; });
    expect(cost()).toEqual(0);
  });

  it('Blood Moon does 240 and this Pokémon can\'t attack during the next turn', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.prizes.slice(0, 4).forEach(p => { p.cards = []; });
    TestUtils.setActive(sim, [new BloodmoonUrsalunaEx()], [CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Blood Moon'));
    expect(opponent.active.damage).toEqual(240);
    sim.dispatch(new PassTurnAction(2));
    expect(() => sim.dispatch(new AttackAction(1, 'Blood Moon'))).toThrow();
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new PassTurnAction(2));
    // A rejected action restores the state from a copy, so read it again.
    const again = TestUtils.getAll(sim).opponent;
    again.active.damage = 0;
    sim.dispatch(new AttackAction(1, 'Blood Moon'));
    expect(again.active.damage).toEqual(240);
  });

  it('Legacy Energy provides every type, one at a time', () => {
    const { player, state } = TestUtils.getAll(sim);
    player.active.energies.cards = [new LegacyEnergy()];
    const check = new CheckProvidedEnergyEffect(player, player.active);
    sim.store.reduceEffect(state, check);
    expect(check.energyMap.length).toEqual(1);
    expect(check.energyMap[0].provides).toContain(CardType.PSYCHIC);
    expect(check.energyMap[0].provides).toContain(CardType.GRASS);
  });

  it('Legacy Energy: the opponent takes 1 fewer Prize card, once per game', () => {
    const { state, opponent } = TestUtils.getAll(sim);
    state.phase = GamePhase.ATTACK;
    state.activePlayer = 0;
    const knockOut = (card: PokemonCard) => {
      opponent.active.pokemons.cards = [card];
      opponent.active.energies.cards = [new LegacyEnergy()];
      const ko = new KnockOutEffect(opponent, opponent.active);
      sim.store.reduceEffect(state, ko);
      return ko.prizeCount;
    };
    expect(knockOut(new LatiasEx())).toEqual(1);
    expect(knockOut(new LatiasEx())).toEqual(2);
  });

  it('Legacy Energy does nothing for a Knock Out outside the opponent\'s attack', () => {
    const { state, opponent } = TestUtils.getAll(sim);
    state.phase = GamePhase.PLAYER_TURN;
    state.activePlayer = 1;
    opponent.active.pokemons.cards = [new Dhelmise()];
    opponent.active.energies.cards = [new LegacyEnergy()];
    const ko = new KnockOutEffect(opponent, opponent.active);
    sim.store.reduceEffect(state, ko);
    expect(ko.prizeCount).toEqual(1);
  });

  it('HideNSneak.countInDiscard counts only Pokémon with the Ability', () => {
    const { player } = TestUtils.getAll(sim);
    player.discard.cards = [...hideNSneakDiscard(3), new Dhelmise(), new TestPokemon()];
    expect(HideNSneak.countInDiscard(player)).toEqual(3);
  });
});
