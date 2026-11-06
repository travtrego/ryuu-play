import {
  AttackAction,
  CardTag,
  CardType,
  ChoosePokemonPrompt,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
  UseAbilityAction,
} from '@ptcg/common';

import { Budew } from '../../../src/standard/set-ascended-heroes/budew';
import { FezandipitiEx } from '../../../src/standard/set-ascended-heroes/fezandipiti-ex';
import { LuckyHelmet } from '../../../src/standard/set-twilight-masquerade/lucky-helmet';
import { UltraBall } from '../../../src/standard/set-black-and-white/ultra-ball';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class WeakToDark extends TestPokemon {
  public weakness = [{ type: CardType.DARK }];
}

describe('Ascended Heroes cards', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  describe('Budew ASC', () => {
    it('Itchy Pollen: 10 damage and no Items (or Tools) for the opponent next turn', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new Budew()]);
      opponent.hand.cards = [new UltraBall(), new LuckyHelmet()];
      sim.dispatch(new AttackAction(1, 'Itchy Pollen'));
      expect(opponent.active.damage).toEqual(10);
      expect(() => sim.dispatch(new PlayCardAction(2, 0, TestUtils.target(sim, undefined, opponent)))).toThrow();
      expect(() => sim.dispatch(new PlayCardAction(2, 1, TestUtils.target(sim, opponent.active, opponent))))
        .toThrow();

      // A rejected action restores the state from a copy, so read it again.
      // After that turn, Items are allowed again.
      sim.dispatch(new AttackAction(2, 'Test attack'));
      const after = TestUtils.getAll(sim);
      expect(after.opponent.marker.hasMarker(new Budew().ITCHY_POLLEN_MARKER)).toBeFalse();
      expect(player).toBeDefined();
    });

    it('Should have the printed stats', () => {
      const card = new Budew();
      expect([card.hp, card.retreat.length, card.attacks[0].cost.length]).toEqual([30, 0, 0]);
      expect(card.weakness).toEqual([{ type: CardType.FIRE }]);
    });
  });

  describe('Fezandipiti ex ASC', () => {
    it('Should have the printed stats', () => {
      const card = new FezandipitiEx();
      expect([card.hp, card.cardTypes[0], card.retreat.length]).toEqual([210, CardType.DARK, 1]);
      expect(card.tags).toContain(CardTag.POKEMON_EX);
    });

    it('Flip the Script: draw 3 only after one of your Pokémon was Knocked Out last turn, 1 per turn', () => {
      const { player, state } = TestUtils.getAll(sim);
      player.bench[0].pokemons.cards = [new FezandipitiEx()];
      player.bench[1].pokemons.cards = [new FezandipitiEx()];
      state.turn = 6;
      expect(() => sim.dispatch(new UseAbilityAction(1, 'Flip the Script', TestUtils.target(sim, player.bench[0]))))
        .toThrow();
      // A rejected action restores the state from a copy, so read it again.
      const p = TestUtils.getAll(sim).player;
      p.knockedOutTurn = 5;
      sim.dispatch(new UseAbilityAction(1, 'Flip the Script', TestUtils.target(sim, p.bench[0])));
      expect(p.hand.cards.length).toEqual(3);
      expect(() => sim.dispatch(new UseAbilityAction(1, 'Flip the Script', TestUtils.target(sim, p.bench[1]))))
        .toThrow();
      expect(state).toBeDefined();
    });

    it('Cruel Arrow: 100 to the Active with Weakness, or 100 to a Benched Pokémon without it', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new FezandipitiEx()], [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]);
      opponent.bench[0].pokemons.cards = [new WeakToDark()];
      sim.dispatch(new AttackAction(1, 'Cruel Arrow'));
      const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
      sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[0]]));
      expect(opponent.bench[0].damage).toEqual(100);
      expect(opponent.active.damage).toEqual(0);
    });

    it('Cruel Arrow on the Active applies Weakness', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new FezandipitiEx()], [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]);
      opponent.active.pokemons.cards = [new WeakToDark()];
      sim.dispatch(new AttackAction(1, 'Cruel Arrow'));
      const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
      sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.active]));
      expect(opponent.active.damage).toEqual(200);
    });
  });
});
