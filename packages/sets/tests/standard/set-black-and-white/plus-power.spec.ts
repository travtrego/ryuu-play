import {
  AttackAction,
  CardType,
  PassTurnAction,
  PlayCardAction,
  Simulator,
} from '@ptcg/common';

import { PlusPower } from '../../../src/standard/set-black-and-white/plus-power';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('PlusPower BW', () => {
  let sim: Simulator;
  let trainerCard: PlusPower;
  let pokemonCard: TestPokemon;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new PlusPower();
    pokemonCard = new TestPokemon();
    sim.store.state.players[0].hand.cards = [trainerCard];
    TestUtils.setActive(sim, [pokemonCard]);
    TestUtils.setDefending(sim, [new TestPokemon()]);
  });

  // During this turn, your Pokemon's attacks do 10 more damage to the Active Pokemon
  // (before applying Weakness and Resistance).
  it('Should add 10 damage to an attack this turn', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should add 10 before Weakness is applied', () => {
    const { opponent } = TestUtils.getAll(sim);
    pokemonCard.cardTypes = [CardType.FIRE];
    const defending = new TestPokemon();
    defending.weakness = [{ type: CardType.FIRE }];
    TestUtils.setDefending(sim, [defending]);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new AttackAction(1, 'Test attack'));

    // (10 + 10) doubled by Weakness
    expect(opponent.active.damage).toEqual(40);
  });

  it('Should not add damage on a later turn', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(opponent.active.damage).toEqual(10);
  });

  it('Should not add damage to an attack that does none', () => {
    const { opponent } = TestUtils.getAll(sim);
    pokemonCard.attacks[0].damage = '0';

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(opponent.active.damage).toEqual(0);
  });
});
