import {
  AttackAction,
  CardType,
  PassTurnAction,
  PlayCardAction,
  Simulator,
} from '@ptcg/common';

import { Pluspower } from '../../../src/base-sets/set-base/pluspower';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('PlusPower BS', () => {
  let sim: Simulator;
  let trainerCard: Pluspower;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new Pluspower();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  it('Should attach to the Active Pokémon and add 10 damage to the Defending Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    expect(player.active.trainers.cards).toEqual([trainerCard]);

    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should add 10 damage after applying Weakness', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    (player.active.getPokemonCard() as TestPokemon).cardTypes = [CardType.FIRE];
    (opponent.active.getPokemonCard() as TestPokemon).weakness = [{ type: CardType.FIRE }];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new AttackAction(1, 'Test attack'));

    // 10 x2 = 20, plus 10
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should not add damage when the attack does no damage', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TestPokemon()]);
    player.active.getPokemonCard()!.attacks[0].damage = '';

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(opponent.active.damage).toEqual(0);
  });

  it('Should be discarded at the end of your turn', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new PassTurnAction(1));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.trainers.cards).toEqual([]);
    expect(player.discard.cards).toEqual([trainerCard]);
  });
});
