import {
  AttackAction,
  CardType,
  PassTurnAction,
  PokemonCard,
  Simulator,
} from '@ptcg/common';

import { Aron2 } from '../../../src/ex-sets/set-ruby-and-sapphire/aron-2';
import { TestUtils } from '../../test-utils';

describe('Aron RS 2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Aron2()], [CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Teary Eyes - During your opponent's next turn, any damage done to Aron by attacks is reduced by 10.
  it('Should use Teary Eyes - reduces damage during opponent\'s next turn', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const attacker = opponent.active.getPokemonCard() as PokemonCard;
    attacker.attacks = [{ name: 'Big attack', cost: [], damage: '30', text: '' }];

    sim.dispatch(new AttackAction(1, 'Teary Eyes'));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);

    sim.dispatch(new AttackAction(2, 'Big attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(20);
  });

  it('Should use Teary Eyes - applies after Weakness', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const attacker = opponent.active.getPokemonCard() as PokemonCard;
    attacker.cardTypes = [CardType.FIRE];
    attacker.attacks = [{ name: 'Big attack', cost: [], damage: '15', text: '' }];

    sim.dispatch(new AttackAction(1, 'Teary Eyes'));
    sim.dispatch(new AttackAction(2, 'Big attack'));

    // 15 x2 (Fire Weakness) - 10
    expect(player.active.damage).toEqual(20);
  });

  it('Should use Teary Eyes - effect ends after opponent\'s next turn', () => {
    const { player } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Teary Eyes'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
  });

  // Ram (20)
  it('Should use Ram', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Ram'));

    expect(opponent.active.damage).toEqual(20);
  });

});
