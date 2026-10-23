import {
  AttackAction,
  CardType,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { DarkMachoke } from '../../../src/base-sets/set-team-rocket/dark-machoke';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Dark Machoke TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new DarkMachoke()],
      [CardType.FIGHTING, CardType.FIGHTING, CardType.FIGHTING]
    );
  });

  // Drag Off (20) - Before doing damage, choose 1 of your opponent's Benched Pokémon and switch it with the
  // Defending Pokémon. Do the damage to the new Defending Pokémon. This attack can't be used if your opponent has
  // no Benched Pokémon.
  it('Should use Drag Off - switch first, then damage the new Defending Pokémon', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();
    const benched = new TestPokemon();
    benched.weakness = [{ type: CardType.FIGHTING }];
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[1] = TestUtils.pokemonSlot([benched]);

    sim.dispatch(new AttackAction(1, 'Drag Off'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[1]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.getPokemonCard()).toBe(benched);
    expect(opponent.active.damage).toEqual(40); // Weakness applies to the new Defending Pokémon
    expect(opponent.bench[1].getPokemonCard()).toBe(defending);
    expect(opponent.bench[1].damage).toEqual(0);
  });

  // BUG: Drag Off can be used (doing 20 damage without switching) when the opponent has no Benched Pokémon
  xit('Should not be able to use Drag Off when the opponent has no Benched Pokémon', () => {
    let message = '';
    try {
      sim.dispatch(new AttackAction(1, 'Drag Off'));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    const { player, opponent } = TestUtils.getAll(sim);
    expect(message).not.toEqual('');
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  // Knock Back (30) - If your opponent has any Benched Pokémon, he or she chooses 1 of them and switches it with
  // the Defending Pokémon. (Do the damage before switching the Pokémon.)
  it('Should use Knock Back - damage first, then the opponent switches', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();
    const benched = new TestPokemon();
    opponent.bench[0] = TestUtils.pokemonSlot([benched]);

    sim.dispatch(new AttackAction(1, 'Knock Back'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: opponent.id,
      slots: [SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.getPokemonCard()).toBe(benched);
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.bench[0].getPokemonCard()).toBe(defending);
    expect(opponent.bench[0].damage).toEqual(30);
  });

  it('Should use Knock Back without opponent\'s Benched Pokémon', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Knock Back'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });
});
