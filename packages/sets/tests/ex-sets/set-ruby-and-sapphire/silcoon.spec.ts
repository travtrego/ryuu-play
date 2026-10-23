import {
  AttackAction,
  CardType,
  GameMessage,
  PassTurnAction,
  PokemonCard,
  RetreatAction,
  Simulator,
} from '@ptcg/common';

import { Silcoon } from '../../../src/ex-sets/set-ruby-and-sapphire/silcoon';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Silcoon RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Silcoon()], [CardType.GRASS]);

    const { opponent } = TestUtils.getAll(sim);
    const attacker = opponent.active.getPokemonCard() as PokemonCard;
    attacker.attacks = [
      { name: 'Big attack', cost: [], damage: '50', text: '' },
      { name: 'Growl', cost: [], damage: '', text: '' },
    ];
  });

  // Hard Cocoon - During your opponent's turn, if Silcoon would be damaged by an opponent's attack (after applying
  // Weakness and Resistance), flip a coin. If heads, reduce that damage by 30.
  it('Should use Hard Cocoon - heads', () => {
    const { player } = TestUtils.getAll(sim);

    sim.dispatch(new PassTurnAction(1));
    TestUtils.setFlipResults(sim, [true]);
    sim.dispatch(new AttackAction(2, 'Big attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(20);
  });

  it('Should use Hard Cocoon - tails', () => {
    const { player } = TestUtils.getAll(sim);

    sim.dispatch(new PassTurnAction(1));
    TestUtils.setFlipResults(sim, [false]);
    sim.dispatch(new AttackAction(2, 'Big attack'));

    expect(player.active.damage).toEqual(50);
  });

  it('Should use Hard Cocoon - power blocked', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    sim.dispatch(new PassTurnAction(1));
    TestUtils.setFlipResults(sim, [true]);
    sim.dispatch(new AttackAction(2, 'Big attack'));

    expect(player.active.damage).toEqual(50);
  });

  it('Should use Hard Cocoon - heads on a non-damaging attack does not carry over', () => {
    const { player } = TestUtils.getAll(sim);

    sim.dispatch(new PassTurnAction(1));
    TestUtils.setFlipResults(sim, [true]);
    sim.dispatch(new AttackAction(2, 'Growl'));

    sim.dispatch(new PassTurnAction(1));
    TestUtils.setFlipResults(sim, [false]);
    sim.dispatch(new AttackAction(2, 'Big attack'));

    expect(player.active.damage).toEqual(50);
  });

  // Gooey Thread (10) - The Defending Pokémon can't retreat until the end of your opponent's next turn.
  it('Should use Gooey Thread - blocks retreat', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Gooey Thread'));

    let message = '';
    try {
      sim.dispatch(new RetreatAction(2, 0));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(message).toEqual(GameMessage.BLOCKED_BY_EFFECT);
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should use Gooey Thread - effect ends after opponent\'s next turn', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    const defending = opponent.active;

    sim.dispatch(new AttackAction(1, 'Gooey Thread'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new RetreatAction(2, 0));

    expect(opponent.bench[0]).toBe(defending);
  });

});
