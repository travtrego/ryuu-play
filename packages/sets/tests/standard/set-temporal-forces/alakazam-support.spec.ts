import {
  AddSpecialConditionsEffect,
  AttackAction,
  AttackEffect,
  CardType,
  ChooseCardsPrompt,
  Effect,
  PlayCardAction,
  PlayerType,
  PokemonCard,
  PutDamagePrompt,
  ResolvePromptAction,
  Simulator,
  SlotType,
  SpecialCondition,
  State,
  StoreLike,
  UseAbilityAction,
} from '@ptcg/common';

import { Eri } from '../../../src/standard/set-temporal-forces/eri';
import { FlutterMane } from '../../../src/standard/set-temporal-forces/flutter-mane';
import { MistEnergy } from '../../../src/standard/set-temporal-forces/mist-energy';
import { Dudunsparce } from '../../../src/standard/set-temporal-forces/dudunsparce';
import { Dunsparce } from '../../../src/standard/set-temporal-forces/dunsparce';
import { UltraBall } from '../../../src/standard/set-black-and-white/ultra-ball';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class PoisonAttacker extends PokemonCard {
  public cardTypes: CardType[] = [CardType.GRASS];
  public hp = 100;
  public attacks = [{ name: 'Poison Bite', cost: [], damage: '30', text: '' }];
  public set = 'TEST';
  public name = 'Poison Attacker';
  public fullName = 'Poison Attacker TEST';
  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      store.reduceEffect(state, new AddSpecialConditionsEffect(effect, [SpecialCondition.POISONED]));
    }
    return state;
  }
}

describe('Temporal Forces cards for Alakazam', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  describe('Flutter Mane TEF', () => {
    it('Midnight Fluttering: in the Active Spot, the opponent\'s Active has no Abilities', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new FlutterMane()]);
      opponent.active.pokemons.cards = [new Dunsparce(), new Dudunsparce()];
      opponent.bench[0].pokemons.cards = [new TestPokemon()];
      // The opponent's turn.
      sim.store.state.activePlayer = 1;
      expect(() => sim.dispatch(new UseAbilityAction(2, 'Run Away Draw', TestUtils.target(sim, opponent.active, opponent))))
        .toThrow();
      expect(player).toBeDefined();
    });

    it('does nothing from the Bench', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      player.bench[0].pokemons.cards = [new FlutterMane()];
      opponent.active.pokemons.cards = [new Dunsparce(), new Dudunsparce()];
      opponent.bench[0].pokemons.cards = [new TestPokemon()];
      sim.store.state.activePlayer = 1;
      sim.dispatch(new UseAbilityAction(2, 'Run Away Draw', TestUtils.target(sim, opponent.active, opponent)));
      expect(opponent.hand.cards.length).toEqual(3);
    });

    it('Hex Hurl: 90 and 2 damage counters on the opponent\'s Bench', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new FlutterMane()], [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]);
      opponent.bench[0].pokemons.cards = [new TestPokemon()];
      sim.dispatch(new AttackAction(1, 'Hex Hurl'));
      const prompt = TestUtils.lastPrompt(sim, player) as PutDamagePrompt;
      expect(prompt.damage).toEqual(20);
      sim.dispatch(new ResolvePromptAction(prompt.id, [
        { target: { player: PlayerType.TOP_PLAYER, slot: SlotType.BENCH, index: 0 }, damage: 20 }
      ]));
      expect(opponent.active.damage).toEqual(90);
      expect(opponent.bench[0].damage).toEqual(20);
    });
  });

  describe('Eri TEF', () => {
    it('discards up to 2 Item cards from the opponent\'s hand', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      const items = [new UltraBall(), new UltraBall()];
      const other = new TestPokemon();
      opponent.hand.cards = [...items, other];
      player.hand.cards = [new Eri()];
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
      const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
      expect(prompt.validate([other])).toBeFalse();
      sim.dispatch(new ResolvePromptAction(prompt.id, items));
      expect(opponent.hand.cards).toEqual([other]);
      expect(opponent.discard.cards).toEqual(items);
    });
  });

  describe('Mist Energy TEF', () => {
    it('prevents effects of the opponent\'s attacks, but not damage', () => {
      const { opponent } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new PoisonAttacker()]);
      opponent.active.energies.cards = [new MistEnergy()];
      sim.dispatch(new AttackAction(1, 'Poison Bite'));
      expect(opponent.active.damage).toEqual(30);
      expect(opponent.active.specialConditions).not.toContain(SpecialCondition.POISONED);
    });

    it('provides C Energy', () => {
      expect(new MistEnergy().provides).toEqual([CardType.COLORLESS]);
    });
  });
});
