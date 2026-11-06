import {
  AttackAction,
  CardType,
  GameMessage,
  PassTurnAction,
  PlayCardAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { DarkVileplume } from '../../../src/base-sets/set-team-rocket/dark-vileplume';
import { DarkGloom } from '../../../src/base-sets/set-team-rocket/dark-gloom';
import { Oddish } from '../../../src/base-sets/set-team-rocket/oddish';
import { Sleep } from '../../../src/base-sets/set-team-rocket/sleep';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Dark Vileplume TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Oddish(), new DarkGloom(), new DarkVileplume()],
      [CardType.GRASS, CardType.GRASS, CardType.GRASS]
    );
  });

  function playSleep(clientId: number = 1): string {
    const { player, opponent } = TestUtils.getAll(sim);
    const owner = clientId === 1 ? player : opponent;
    owner.hand.cards = [new Sleep()];
    let message = '';
    try {
      sim.dispatch(new PlayCardAction(clientId, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Hay Fever - No Trainer cards can be played. This power stops working while Dark Vileplume is Asleep, Confused,
  // or Paralyzed.
  it('Should block its owner\'s Trainer cards', () => {
    expect(playSleep()).toEqual(GameMessage.BLOCKED_BY_ABILITY);
    expect(TestUtils.getAll(sim).player.hand.cards.length).toEqual(1);
  });

  it('Should block the opponent\'s Trainer cards', () => {
    const { opponent } = TestUtils.getAll(sim);
    sim.dispatch(new PassTurnAction(1));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();

    expect(playSleep(2)).toEqual(GameMessage.BLOCKED_BY_ABILITY);
  });

  it('Should block Trainer cards while Dark Vileplume is on the Bench', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new Oddish(), new DarkGloom(), new DarkVileplume()]);
    TestUtils.setActive(sim, [new TestPokemon()]);

    expect(playSleep()).toEqual(GameMessage.BLOCKED_BY_ABILITY);
  });

  [SpecialCondition.ASLEEP, SpecialCondition.CONFUSED, SpecialCondition.PARALYZED].forEach(condition => {
    it(`Should not block Trainer cards while Dark Vileplume is ${SpecialCondition[condition]}`, () => {
      const { player } = TestUtils.getAll(sim);
      player.active.addSpecialCondition(condition);

      expect(playSleep()).toEqual('');
      expect(player.hand.cards.length).toEqual(0);
    });
  });

  it('Should not block Trainer cards when Pokémon Powers are blocked', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    expect(playSleep()).toEqual('');
  });

  // Petal Whirlwind (30×) - Flip 3 coins. This attack does 30 damage times the number of heads. If you get 2 or
  // more heads, Dark Vileplume is now Confused (after doing damage).
  [
    { flips: [true, true, true], damage: 90, confused: true },
    { flips: [true, true, false], damage: 60, confused: true },
    { flips: [true, false, false], damage: 30, confused: false },
    { flips: [false, false, false], damage: 0, confused: false },
  ].forEach(({ flips, damage, confused }) => {
    it(`Should use Petal Whirlwind - ${flips.filter(f => f).length} heads`, () => {
      const { player, opponent } = TestUtils.getAll(sim);
      TestUtils.setFlipResults(sim, flips);

      sim.dispatch(new AttackAction(1, 'Petal Whirlwind'));

      expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
      expect(opponent.active.damage).toEqual(damage);
      expect(opponent.active.specialConditions).toEqual([]);
      expect(player.active.specialConditions).toEqual(confused ? [SpecialCondition.CONFUSED] : []);
    });
  });
});
