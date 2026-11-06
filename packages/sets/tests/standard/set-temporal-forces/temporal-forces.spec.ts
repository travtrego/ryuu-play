import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
  UseAbilityAction,
} from '@ptcg/common';

import { BuddyBuddyPoffin } from '../../../src/standard/set-temporal-forces/buddy-buddy-poffin';
import { Dudunsparce } from '../../../src/standard/set-temporal-forces/dudunsparce';
import { Dunsparce } from '../../../src/standard/set-temporal-forces/dunsparce';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class SmallBasic extends TestPokemon {
  public hp = 70;
}

describe('Temporal Forces cards', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  describe('Buddy-Buddy Poffin TEF', () => {
    it('puts up to 2 Basic Pokémon with 70 HP or less onto the Bench', () => {
      const { player } = TestUtils.getAll(sim);
      const small1 = new SmallBasic();
      const small2 = new SmallBasic();
      const big = new TestPokemon(); // 400 HP
      player.hand.cards = [new BuddyBuddyPoffin()];
      player.deck.cards = [big, small1, small2, ...TestUtils.makeTestCards(3)];
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
      const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
      expect(prompt.options.blocked).toContain(0);
      expect(prompt.validate([big])).toBeFalse();
      sim.dispatch(new ResolvePromptAction(prompt.id, [small1, small2]));
      expect(player.bench[0].getPokemonCard()).toBe(small1);
      expect(player.bench[1].getPokemonCard()).toBe(small2);
    });

    it('can\'t be played with a full Bench', () => {
      const { player } = TestUtils.getAll(sim);
      player.bench.forEach(slot => { slot.pokemons.cards = [new TestPokemon()]; });
      player.hand.cards = [new BuddyBuddyPoffin()];
      expect(() => sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)))).toThrow();
    });
  });

  describe('Dunsparce TEF', () => {
    it('Dig on heads: no damage or effects from the opponent\'s next attack', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new Dunsparce()], [CardType.COLORLESS, CardType.COLORLESS]);
      TestUtils.setFlipResults(sim, [true]);
      sim.dispatch(new AttackAction(1, 'Dig'));
      expect(opponent.active.damage).toEqual(30);
      sim.dispatch(new AttackAction(2, 'Test attack'));
      expect(player.active.damage).toEqual(0);
    });

    it('Dig on tails: no protection', () => {
      const { player } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new Dunsparce()], [CardType.COLORLESS, CardType.COLORLESS]);
      TestUtils.setFlipResults(sim, [false]);
      sim.dispatch(new AttackAction(1, 'Dig'));
      sim.dispatch(new AttackAction(2, 'Test attack'));
      expect(player.active.damage).toEqual(10);
    });
  });

  describe('Dudunsparce TEF', () => {
    it('Should have the printed stats', () => {
      const card = new Dudunsparce();
      expect([card.hp, card.evolvesFrom, card.retreat.length]).toEqual([140, 'Dunsparce', 3]);
      expect(new Dunsparce().retreat.length).toEqual(0);
    });

    it('Run Away Draw: draw 3, then shuffle Dudunsparce and its cards into the deck', () => {
      const { player } = TestUtils.getAll(sim);
      const dunsparce = new Dunsparce();
      const dudunsparce = new Dudunsparce();
      player.bench[0].pokemons.cards = [dunsparce, dudunsparce];
      player.bench[0].energies.cards = TestUtils.makeEnergies([CardType.COLORLESS]);
      player.bench[0].damage = 30;
      sim.dispatch(new UseAbilityAction(1, 'Run Away Draw', TestUtils.target(sim, player.bench[0])));
      expect(player.hand.cards.length).toEqual(3);
      expect(player.bench[0].pokemons.cards.length).toEqual(0);
      expect(player.bench[0].damage).toEqual(0);
      expect(player.deck.cards).toEqual(jasmine.arrayContaining([dunsparce, dudunsparce]));
      expect(player.deck.cards.length).toEqual(50 - 3 + 3);
    });

    it('Run Away Draw from the Active Spot asks for a new Active Pokémon', () => {
      const { player } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new Dunsparce(), new Dudunsparce()]);
      player.bench[0].pokemons.cards = [new TestPokemon()];
      sim.dispatch(new UseAbilityAction(1, 'Run Away Draw', TestUtils.target(sim, player.active)));
      expect(player.active.pokemons.cards.length === 1 || sim.store.state.prompts.some(p => p.result === undefined))
        .toBeTrue();
    });

    it('can\'t be used by your only Pokémon in play', () => {
      const { player } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new Dunsparce(), new Dudunsparce()]);
      expect(() => sim.dispatch(new UseAbilityAction(1, 'Run Away Draw', TestUtils.target(sim, player.active))))
        .toThrow();
    });
  });
});
