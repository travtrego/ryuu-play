import {
  AttackAction,
  CardType,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { Raichu } from '../../../src/base-sets/set-fossil/raichu';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Raichu FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Raichu()],
      [CardType.LIGHTNING, CardType.LIGHTNING, CardType.LIGHTNING, CardType.LIGHTNING]
    );
  });

  // Gigashock (30) - Choose 3 of your opponent's Benched Pokémon and this attack does 10 damage to each of them.
  // (Don't apply Weakness and Resistance for Benched Pokémon.) If your opponent has fewer than 3 Benched Pokémon,
  // do the damage to each of them.
  it('Should use Gigashock and damage 3 chosen Benched Pokémon', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    const weak = new TestPokemon();
    weak.weakness = [{ type: CardType.LIGHTNING }];
    opponent.bench[0] = TestUtils.pokemonSlot([weak]);
    for (let i = 1; i < 5; i++) {
      opponent.bench[i] = TestUtils.pokemonSlot([new TestPokemon()]);
    }

    sim.dispatch(new AttackAction(1, 'Gigashock'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.BENCH],
      options: jasmine.objectContaining({ min: 3, max: 3 })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[0], opponent.bench[2], opponent.bench[4]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.bench.map(b => b.damage)).toEqual([10, 0, 10, 0, 10]);
  });

  it('Should use Gigashock - fewer than 3 Benched Pokémon', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    opponent.bench[1] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[3] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Gigashock'));
    if (prompts.length > 0 && prompts[0].result === undefined) {
      expect((prompts[0] as any).options).toEqual(jasmine.objectContaining({ min: 2, max: 2 }));
      sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[1], opponent.bench[3]]));
    }

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.bench.map(b => b.damage)).toEqual([0, 10, 0, 10, 0]);
  });

  it('Should use Gigashock - no Benched Pokémon', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Gigashock'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });
});
