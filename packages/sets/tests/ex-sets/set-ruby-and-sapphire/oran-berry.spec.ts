import {
  PassTurnAction,
  PlayCardAction,
  Simulator,
  TrainerCard,
} from '@ptcg/common';

import { OranBerry } from '../../../src/ex-sets/set-ruby-and-sapphire/oran-berry';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Oran Berry RS', () => {
  let sim: Simulator;
  let trainerCard: TrainerCard;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new OranBerry();
  });

  // At any time between turns, if the Pokémon this card is attached to has at least 2 damage counters on it, remove
  // 2 damage counters from it. Then discard Oran Berry.
  it('Should attach Oran Berry as a Pokemon Tool', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [trainerCard];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect(player.active.trainers.cards).toEqual([trainerCard]);
  });

  it('Should remove 2 damage counters between turns and discard Oran Berry', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.trainers.cards = [trainerCard];
    player.active.damage = 50;

    sim.dispatch(new PassTurnAction(1));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.damage).toEqual(30);
    expect(player.active.trainers.cards).toEqual([]);
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should work on a Benched Pokemon', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [], [trainerCard], 20);

    sim.dispatch(new PassTurnAction(1));

    expect(player.bench[0].damage).toEqual(0);
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should work on the opponent\'s Pokemon', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.active.trainers.cards = [trainerCard];
    opponent.active.damage = 40;

    sim.dispatch(new PassTurnAction(1));

    expect(opponent.active.damage).toEqual(20);
    expect(opponent.discard.cards).toEqual([trainerCard]);
  });

  it('Should stay attached with fewer than 2 damage counters', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.trainers.cards = [trainerCard];
    player.active.damage = 10;

    sim.dispatch(new PassTurnAction(1));

    expect(player.active.damage).toEqual(10);
    expect(player.active.trainers.cards).toEqual([trainerCard]);
  });

});
