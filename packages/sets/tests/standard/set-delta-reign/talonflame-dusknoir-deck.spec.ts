import {
  AttackAction,
  CardTag,
  CardType,
  CheckHpEffect,
  CheckProvidedEnergyEffect,
  CheckRetreatCostEffect,
  ChooseCardsPrompt,
  GameError,
  GameMessage,
  PlayCardAction,
  PlayerType,
  PowerType,
  ResolvePromptAction,
  ShowCardsPrompt,
  ShuffleDeckPrompt,
  Simulator,
  SlotType,
  Stage,
  StateUtils,
  TrainerType,
  UseAbilityAction,
} from '@ptcg/common';

import { TalonflameEx } from '../../../src/standard/set-delta-reign/talonflame-ex';
import { DuskBall } from '../../../src/standard/set-surging-sparks/dusk-ball';
import { NeoUpperEnergy } from '../../../src/standard/set-temporal-forces/neo-upper-energy';
import { JammingTower } from '../../../src/standard/set-twilight-masquerade/jamming-tower';
import { MegaKangaskhanEx } from '../../../src/standard/set-mega-evolution/mega-kangaskhan-ex';
import { MegaLucarioEx } from '../../../src/standard/set-mega-evolution/mega-lucario-ex';
import { Dusknoir as DusknoirPRE } from '../../../src/standard/set-prismatic-evolutions/dusknoir';
import { Duskull as DuskullPRE } from '../../../src/standard/set-prismatic-evolutions/duskull';
import { AirBalloon } from '../../../src/standard/set-ascended-heroes/air-balloon';
import { HerosCape } from '../../../src/standard/set-temporal-forces/heros-cape';
import { TestCard } from '../../test-cards/test-card';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

const hand = (index: number) => ({ player: PlayerType.BOTTOM_PLAYER, slot: SlotType.HAND, index });
const bench0 = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 };

describe('Talonflame Dusknoir deck cards', () => {
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

  function finishSearch(): void {
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
    const talonflame = new TalonflameEx();
    expect<unknown[]>([talonflame.hp, talonflame.stage, talonflame.evolvesFrom, talonflame.cardTypes,
      talonflame.weakness, talonflame.resistance, talonflame.retreat.length, talonflame.tags])
      .toEqual([280, Stage.STAGE_2, 'Fletchinder', [CardType.COLORLESS], [{ type: CardType.LIGHTNING }],
        [{ type: CardType.FIGHTING, value: -30 }], 0, [CardTag.POKEMON_EX]]);
    expect(talonflame.powers.map(p => [p.name, p.powerType, !!p.useFromHand, !!(p as { useWhenInPlay?: boolean }).useWhenInPlay]))
      .toEqual([['Excited Dive', PowerType.ABILITY, true, false]]);
    expect(talonflame.attacks.map(a => [a.name, a.cost, a.damage]))
      .toEqual([['Talon Hunt', [CardType.COLORLESS, CardType.COLORLESS], '150']]);
    expect(talonflame.fullName).toEqual('Talonflame ex DLR');

    expect([new DuskBall().trainerType, new DuskBall().fullName]).toEqual([TrainerType.ITEM, 'Dusk Ball SSP']);
    expect([new JammingTower().trainerType, new JammingTower().fullName])
      .toEqual([TrainerType.STADIUM, 'Jamming Tower TWM']);
    const neo = new NeoUpperEnergy();
    expect([neo.provides, neo.tags, neo.fullName]).toEqual([[CardType.COLORLESS], [CardTag.ACE_SPEC],
      'Neo Upper Energy TEF']);
  });

  describe('Excited Dive', () => {
    it('Puts Talonflame ex from the hand onto the Bench with a C Mega Evolution Pokémon ex in play', () => {
      const { player } = TestUtils.getAll(sim);
      const talonflame = new TalonflameEx();
      player.bench[1].pokemons.cards = [new MegaKangaskhanEx()];
      player.hand.cards = [new TestCard(), talonflame];

      sim.dispatch(new UseAbilityAction(1, 'Excited Dive', hand(1)));

      expect(player.hand.cards.includes(talonflame)).toBeFalse();
      expect(player.bench[0].getPokemonCard()).toBe(talonflame);
      expect(player.bench[0].pokemonPlayedTurn).toEqual(5);
    });

    it('Works with the Mega Evolution Pokémon ex in the Active Spot', () => {
      const { player } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new MegaKangaskhanEx()]);
      player.hand.cards = [new TalonflameEx()];
      sim.dispatch(new UseAbilityAction(1, 'Excited Dive', hand(0)));
      expect(player.bench[0].getPokemonCard() instanceof TalonflameEx).toBeTrue();
    });

    it('Can\'t be used without a C Mega Evolution Pokémon ex, or with a full Bench', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      player.hand.cards = [new TalonflameEx()];
      // A Mega of another type and the opponent's C Mega don't count.
      player.bench[1].pokemons.cards = [new MegaLucarioEx()];
      opponent.bench[0].pokemons.cards = [new MegaKangaskhanEx()];
      expect(code(() => sim.dispatch(new UseAbilityAction(1, 'Excited Dive', hand(0)))))
        .toEqual(GameMessage.CANNOT_USE_POWER);

      player.bench.forEach(b => { b.pokemons.cards = [new TestPokemon()]; });
      player.bench[1].pokemons.cards = [new MegaKangaskhanEx()];
      expect(code(() => sim.dispatch(new UseAbilityAction(1, 'Excited Dive', hand(0)))))
        .toEqual(GameMessage.CANNOT_USE_POWER);
      expect(player.hand.cards.length).toEqual(1);
    });

    it('Can\'t be used once Talonflame ex is in play', () => {
      const { player } = TestUtils.getAll(sim);
      player.bench[0].pokemons.cards = [new TalonflameEx()];
      player.bench[1].pokemons.cards = [new MegaKangaskhanEx()];
      expect(code(() => sim.dispatch(new UseAbilityAction(1, 'Excited Dive', bench0))))
        .toEqual(GameMessage.CANNOT_USE_POWER);
    });
  });

  it('Talon Hunt does 150 and may put up to 2 cards from the deck into the hand', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.hand.cards = [];
    TestUtils.setActive(sim, [new TalonflameEx()], [CardType.COLORLESS, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Talon Hunt'));

    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt instanceof ChooseCardsPrompt).toBeTrue();
    expect(prompt.options.max).toEqual(2);
    const picked = [player.deck.cards[10], player.deck.cards[20]];
    sim.dispatch(new ResolvePromptAction(prompt.id, picked));
    finishSearch();

    expect(player.hand.cards).toEqual(picked);
    expect(player.deck.cards.length).toEqual(48);
    expect(opponent.active.damage).toEqual(150);
  });

  it('Dusk Ball only offers a Pokémon from the bottom 7 cards', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const top = new DuskullPRE();
    const bottom = new DusknoirPRE();
    const card = new DuskBall();
    player.deck.cards = [top, ...TestUtils.makeTestCards(10), bottom, ...TestUtils.makeTestCards(6)];
    player.hand.cards = [card];

    sim.dispatch(new PlayCardAction(1, 0, { player: PlayerType.ANY, slot: SlotType.BOARD, index: 0 }));

    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt.cards.cards.length).toEqual(7);
    expect(prompt.cards.cards.includes(bottom)).toBeTrue();
    expect(prompt.cards.cards.includes(top)).toBeFalse();
    expect(prompt.options.min).toEqual(0);
    sim.dispatch(new ResolvePromptAction(prompt.id, [bottom]));
    expect(TestUtils.lastPrompt(sim, opponent) instanceof ShowCardsPrompt).toBeTrue();
    finishSearch();

    expect(player.hand.cards).toEqual([bottom]);
    expect(player.deck.cards.length).toEqual(17);
    expect(player.deck.cards.includes(top)).toBeTrue();
    expect(player.discard.cards).toEqual([card]);
  });

  it('Neo Upper Energy provides C, or every type 2 at a time on a Stage 2 Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    const neo = new NeoUpperEnergy();
    const provided = () => {
      const check = new CheckProvidedEnergyEffect(player);
      sim.store.reduceEffect(sim.store.state, check);
      return check.energyMap;
    };

    TestUtils.setActive(sim, [new DuskullPRE()]);
    player.active.energies.cards = [neo];
    expect(StateUtils.checkEnoughEnergy(provided(), [CardType.COLORLESS])).toBeTrue();
    expect(StateUtils.checkEnoughEnergy(provided(), [CardType.PSYCHIC])).toBeFalse();
    expect(StateUtils.checkEnoughEnergy(provided(), [CardType.COLORLESS, CardType.COLORLESS])).toBeFalse();

    // Talonflame ex is a Stage 2 Pokémon even when Excited Dive put it into play.
    TestUtils.setActive(sim, [new TalonflameEx()]);
    player.active.energies.cards = [neo];
    expect(StateUtils.checkEnoughEnergy(provided(), [CardType.PSYCHIC, CardType.DARK])).toBeTrue();
    expect(StateUtils.checkEnoughEnergy(provided(), [CardType.COLORLESS, CardType.COLORLESS])).toBeTrue();
    expect(StateUtils.checkEnoughEnergy(provided(), [CardType.COLORLESS, CardType.COLORLESS,
      CardType.COLORLESS])).toBeFalse();
  });

  describe('Jamming Tower', () => {
    function retreatCost(): number {
      const { player } = TestUtils.getAll(sim);
      const check = new CheckRetreatCostEffect(player);
      sim.store.reduceEffect(sim.store.state, check);
      return check.cost.length;
    }

    it('Pokémon Tools in play have no effect while it is in play', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new MegaKangaskhanEx()], [], [new AirBalloon()]);
      opponent.active.pokemons.cards = [new TestPokemon()];
      opponent.active.trainers.cards = [new HerosCape()];
      const hp = () => {
        const check = new CheckHpEffect(opponent, opponent.active);
        sim.store.reduceEffect(sim.store.state, check);
        return check.hp;
      };
      expect(retreatCost()).toEqual(1);
      const capedHp = hp();

      opponent.stadium.cards = [new JammingTower()];
      expect(retreatCost()).toEqual(3);
      expect(hp()).toEqual(capedHp - 100);
      // The Tools stay attached.
      expect(player.active.trainers.cards.length).toEqual(1);

      opponent.stadium.cards = [];
      expect(retreatCost()).toEqual(1);
      expect(hp()).toEqual(capedHp);
    });
  });
});
