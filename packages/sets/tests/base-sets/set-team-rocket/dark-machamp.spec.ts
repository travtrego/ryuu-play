import {
  AttackAction,
  CardType,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { DarkMachamp } from '../../../src/base-sets/set-team-rocket/dark-machamp';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Dark Machamp TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new DarkMachamp()],
      [CardType.FIGHTING, CardType.FIGHTING, CardType.FIGHTING, CardType.FIGHTING]
    );
  });

  // Mega Punch (30)
  it('Should use Mega Punch', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Mega Punch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  // Fling - Your opponent shuffles his or her Active Pokémon and all cards attached to it into his or her deck.
  // This attack can't be used if your opponent has no Benched Pokémon.
  it('Should use Fling - the Defending Pokémon and attached cards are shuffled into the deck', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    const defending = new TestPokemon();
    TestUtils.setDefending(sim, [defending], [CardType.WATER, CardType.WATER]);
    opponent.active.damage = 30;
    const benched = new TestPokemon();
    opponent.bench[0] = TestUtils.pokemonSlot([benched]);

    sim.dispatch(new AttackAction(1, 'Fling'));

    expect(prompts.some(p => p.type === 'Shuffle deck' && p.playerId === opponent.id)).toBeTrue();
    // Opponent chooses a new Active Pokémon
    const choose = prompts.find(p => p.type === 'Choose pokemon' && p.result === undefined);
    if (choose !== undefined) {
      sim.dispatch(new ResolvePromptAction(choose.id, [opponent.bench[0]]));
    }

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.getPokemonCard()).toBe(benched);
    // 50 + Pokémon + 2 Energy, minus the card drawn at the start of the opponent's turn
    expect(opponent.deck.cards.length + opponent.hand.cards.length).toEqual(53);
    expect([...opponent.deck.cards, ...opponent.hand.cards]).toContain(defending);
    expect(opponent.discard.cards).toEqual([]);
    expect(TestUtils.getAll(sim).player.getPrizeLeft()).toEqual(6);
  });

  // BUG: Fling can be used (doing nothing and ending the turn) when the opponent has no Benched Pokémon
  xit('Should not be able to use Fling when the opponent has no Benched Pokémon', () => {
    let message = '';
    try {
      sim.dispatch(new AttackAction(1, 'Fling'));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    const { player, opponent } = TestUtils.getAll(sim);
    expect(message).not.toEqual('');
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.active.pokemons.cards.length).toEqual(1);
  });
});
