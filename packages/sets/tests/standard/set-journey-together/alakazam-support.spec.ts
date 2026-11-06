import {
  AttackAction,
  CardTag,
  CardType,
  ChoosePokemonPrompt,
  KnockOutEffect,
  GamePhase,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { DunsparceJTG } from '../../../src/standard/set-journey-together/dunsparce';
import { LilliesClefairyEx } from '../../../src/standard/set-journey-together/lillies-clefairy-ex';
import { LilliesPearl } from '../../../src/standard/set-journey-together/lillies-pearl';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Journey Together cards for Alakazam', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  it('Dunsparce JTG: printed stats and Trading Places switches it with a Benched Pokémon', () => {
    const card = new DunsparceJTG();
    expect([card.hp, card.retreat.length]).toEqual([70, 1]);
    const { player } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [card], [CardType.COLORLESS]);
    const benched = new TestPokemon();
    player.bench[0].pokemons.cards = [benched];
    sim.dispatch(new AttackAction(1, 'Trading Places'));
    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [player.bench[0]]));
    expect(player.active.getPokemonCard()).toBe(benched);
  });

  describe('Lillie\'s Pearl JTG', () => {
    function knockOut(attackPhase: boolean, opponentTurn: boolean) {
      const { state, opponent } = TestUtils.getAll(sim);
      const clefairy = new LilliesClefairyEx();
      opponent.active.pokemons.cards = [clefairy];
      opponent.active.trainers.cards = [new LilliesPearl()];
      state.phase = attackPhase ? GamePhase.ATTACK : GamePhase.PLAYER_TURN;
      state.activePlayer = opponentTurn ? 0 : 1;
      const ko = new KnockOutEffect(opponent, opponent.active);
      sim.store.reduceEffect(state, ko);
      expect(clefairy.tags).toContain(CardTag.POKEMON_EX);
      return ko.prizeCount;
    }

    it('a Lillie\'s Pokémon ex Knocked Out by an opponent\'s attack gives 1 Prize instead of 2', () => {
      expect(knockOut(true, true)).toEqual(1);
    });

    it('other Knock Outs give the usual Prizes', () => {
      expect(knockOut(false, true)).toEqual(2);
      expect(knockOut(true, false)).toEqual(2);
    });
  });
});
