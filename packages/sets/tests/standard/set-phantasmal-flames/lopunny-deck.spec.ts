import {
  AttackAction,
  CardTag,
  AttackEffect,
  CardType,
  ChooseCardsPrompt,
  ChoosePokemonPrompt,
  GameError,
  GameMessage,
  PassTurnAction,
  PlayCardAction,
  PlayerType,
  PutDamageEffect,
  ResolvePromptAction,
  RetreatAction,
  UseAbilityAction,
  ShuffleDeckPrompt,
  Simulator,
  SlotType,
  SpecialCondition,
  Stage,
  State,
  StoreLike,
  Effect,
  TrainerType,
} from '@ptcg/common';

import { MegaLopunnyEx } from '../../../src/standard/set-phantasmal-flames/mega-lopunny-ex';
import { BunearyPFL } from '../../../src/standard/set-phantasmal-flames/buneary';
import { SnoruntASC } from '../../../src/standard/set-ascended-heroes/snorunt';
import { MegaFroslassEx } from '../../../src/standard/set-ascended-heroes/mega-froslass-ex';
import { FanRotom } from '../../../src/standard/set-stellar-crown/fan-rotom';
import { WallysCompassion } from '../../../src/standard/set-mega-evolution/wallys-compassion';
import { BattleCage } from '../../../src/standard/set-phantasmal-flames/battle-cage';
import { LatiasEx } from '../../../src/standard/set-surging-sparks/latias-ex';
import { TestCard } from '../../test-cards/test-card';
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

const hand = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BOARD, index: 0 };

describe('Lopunny Dudunsparce deck cards', () => {
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
    const lop = new MegaLopunnyEx();
    expect([lop.hp, lop.stage, lop.evolvesFrom, lop.cardTypes, lop.weakness, lop.retreat.length, lop.tags])
      .toEqual([330, Stage.STAGE_1, 'Buneary', [CardType.COLORLESS], [{ type: CardType.FIGHTING }], 1,
        [CardTag.POKEMON_EX, CardTag.MEGA_EVOLUTION_EX]]);
    expect(lop.attacks.map(a => [a.cost.length, a.damage])).toEqual([[1, '60+'], [2, '160']]);
    const bun = new BunearyPFL();
    expect([bun.hp, bun.stage, bun.cardTypes, bun.weakness, bun.retreat.length]).toEqual([70, Stage.BASIC,
      [CardType.COLORLESS], [{ type: CardType.FIGHTING }], 1]);
    const fros = new MegaFroslassEx();
    expect([fros.hp, fros.stage, fros.evolvesFrom, fros.cardTypes, fros.weakness, fros.retreat.length, fros.tags])
      .toEqual([310, Stage.STAGE_1, 'Snorunt', [CardType.WATER], [{ type: CardType.METAL }], 1,
        [CardTag.POKEMON_EX, CardTag.MEGA_EVOLUTION_EX]]);
    expect(fros.attacks.map(a => [a.cost.length, a.damage])).toEqual([[1, '50×'], [3, '150']]);
    const snor = new SnoruntASC();
    expect([snor.hp, snor.cardTypes, snor.weakness, snor.retreat.length]).toEqual([70, [CardType.WATER],
      [{ type: CardType.METAL }], 1]);
    const rotom = new FanRotom();
    expect([rotom.hp, rotom.cardTypes, rotom.weakness, rotom.retreat.length, rotom.powers[0].name])
      .toEqual([70, [CardType.COLORLESS], [{ type: CardType.LIGHTNING }], 1, 'Fan Call']);
    expect(rotom.resistance).toEqual([{ type: CardType.FIGHTING, value: -30 }]);
    expect(new WallysCompassion().trainerType).toEqual(TrainerType.SUPPORTER);
  });

  it('Gale Thrust does 60, or 230 if Mega Lopunny moved to the Active Spot this turn (by retreat)', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TestPokemon()], [CardType.COLORLESS]);
    player.bench[0].pokemons.cards = [new BunearyPFL(), new MegaLopunnyEx()];
    player.bench[0].energies.cards = TestUtils.makeEnergies([CardType.COLORLESS]);
    sim.dispatch(new RetreatAction(1, 0));
    expect(player.active.getPokemonCard() instanceof MegaLopunnyEx).toBeTrue();
    sim.dispatch(new AttackAction(1, 'Gale Thrust'));
    expect(opponent.active.damage).toEqual(230);
  });

  it('Gale Thrust does 60 when Mega Lopunny started the turn Active', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new BunearyPFL(), new MegaLopunnyEx()], [CardType.COLORLESS]);
    // A turn boundary clears the moved marker.
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new AttackAction(1, 'Gale Thrust'));
    expect(opponent.active.damage).toEqual(60);
  });

  it('Spiky Hopper does 160, ignoring effects on the opponent\'s Active Pokémon', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.active.pokemons.cards = [new Shielded()];
    TestUtils.setActive(sim, [new BunearyPFL(), new MegaLopunnyEx()], [CardType.COLORLESS, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Spiky Hopper'));
    expect(opponent.active.damage).toEqual(160);
  });

  it('Run Around switches Buneary with a Benched Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    const lop = new MegaLopunnyEx();
    TestUtils.setActive(sim, [new BunearyPFL()], [CardType.COLORLESS]);
    player.bench[0].pokemons.cards = [lop];
    sim.dispatch(new AttackAction(1, 'Run Around'));
    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [player.bench[0]]));
    expect(player.active.getPokemonCard()).toBe(lop);
  });

  it('Kick does 20', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new BunearyPFL()], [CardType.COLORLESS, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Kick'));
    expect(opponent.active.damage).toEqual(20);
  });

  it('Resentful Refrain does 50 for each card in the opponent\'s hand', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.hand.cards = TestUtils.makeTestCards(4);
    player.active.pokemons.cards = [new SnoruntASC(), new MegaFroslassEx()];
    player.active.energies.cards = TestUtils.makeEnergies([CardType.WATER]);
    sim.dispatch(new AttackAction(1, 'Resentful Refrain'));
    expect(opponent.active.damage).toEqual(200);
  });

  it('Absolute Snow does 150 and leaves the opponent Asleep', () => {
    const { player, opponent, state } = TestUtils.getAll(sim);
    const froslass = new MegaFroslassEx();
    player.active.pokemons.cards = [froslass];
    const attack = new AttackEffect(player, opponent, froslass.attacks[1]);
    sim.store.reduceEffect(state, attack);
    expect(attack.damage).toEqual(150);
    expect(opponent.active.specialConditions).toContain(SpecialCondition.ASLEEP);
  });

  it('Assault Landing does 70 only with a Stadium in play', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new FanRotom()], [CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Assault Landing'));
    expect(opponent.active.damage).toEqual(0);

    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 5;
    const all = TestUtils.getAll(sim);
    all.player.stadium.cards = [new BattleCage()];
    TestUtils.setActive(sim, [new FanRotom()], [CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Assault Landing'));
    expect(all.opponent.active.damage).toEqual(70);
    expect(player).toBeDefined();
  });

  it('Fan Call searches for up to 3 Colorless Pokémon with 100 HP or less, first turn only, once', () => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 1;
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.pokemons.cards = [new FanRotom()];
    const bun = new BunearyPFL();
    const bigEx = new LatiasEx();      // Colorless but >100 HP
    const other = new TestCard();
    player.deck.cards = [bigEx, bun, other];
    sim.dispatch(new UseAbilityAction(player.id, 'Fan Call', TestUtils.target(sim, player.active)));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt.options.blocked).toEqual([0, 2]);
    expect(prompt.options.max).toEqual(3);
    sim.dispatch(new ResolvePromptAction(prompt.id, [bun]));
    const shuffle = TestUtils.lastPrompt(sim, player) as ShuffleDeckPrompt;
    if (shuffle instanceof ShuffleDeckPrompt && shuffle.result === undefined) {
      sim.dispatch(new ResolvePromptAction(shuffle.id, [...Array(player.deck.cards.length).keys()]));
    }
    expect(player.hand.cards).toContain(bun);
    expect(opponent).toBeDefined();
    // Only once per turn.
    expect(code(() => sim.dispatch(new UseAbilityAction(player.id, 'Fan Call', TestUtils.target(sim, player.active)))))
      .toEqual(GameMessage.POWER_ALREADY_USED);
  });

  it('Fan Call can\'t be used after the first turn', () => {
    const { player } = TestUtils.getAll(sim); // turn 5
    player.active.pokemons.cards = [new FanRotom()];
    player.deck.cards = [new BunearyPFL()];
    expect(code(() => sim.dispatch(new UseAbilityAction(player.id, 'Fan Call', TestUtils.target(sim, player.active)))))
      .toEqual(GameMessage.CANNOT_USE_POWER);
  });

  it('Wally\'s Compassion heals a Mega Evolution Pokémon ex and puts its Energy into the hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.pokemons.cards = [new BunearyPFL(), new MegaLopunnyEx()];
    player.active.energies.cards = TestUtils.makeEnergies([CardType.COLORLESS, CardType.COLORLESS]);
    player.active.damage = 100;
    player.bench[0].pokemons.cards = [new TestPokemon()];
    player.hand.cards = [new WallysCompassion()];
    sim.dispatch(new PlayCardAction(1, 0, hand));
    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    expect(prompt.options.blocked.map(t => t.slot)).toEqual([SlotType.BENCH]);
    sim.dispatch(new ResolvePromptAction(prompt.id, [player.active]));
    expect(player.active.damage).toEqual(0);
    expect(player.active.energies.cards.length).toEqual(0);
    expect(player.hand.cards.length).toEqual(2);
  });

  it('Wally\'s Compassion can\'t be played without a Mega Evolution Pokémon ex', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.pokemons.cards = [new LatiasEx()];
    player.hand.cards = [new WallysCompassion()];
    expect(code(() => sim.dispatch(new PlayCardAction(1, 0, hand)))).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });
});
