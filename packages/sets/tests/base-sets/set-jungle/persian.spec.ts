import {
  AttackAction,
  CardType,
  PassTurnAction,
  PokemonCard,
  RetreatAction,
  Simulator,
} from '@ptcg/common';

import { Persian } from '../../../src/base-sets/set-jungle/persian';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Persian JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Persian()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  function setOpponentAttack(card: PokemonCard, damage: number, cardTypes: CardType[] = []) {
    card.attacks[0].damage = String(damage);
    card.cardTypes = cardTypes;
  }

  // Scratch (20)
  it('Should use Scratch', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Scratch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  // Pounce (30) - If the Defending Pokémon attacks Persian during your opponent's next turn, any damage done by the
  // attack is reduced by 10 (after applying Weakness and Resistance). (Benching either Pokémon ends this effect.)
  it('Should use Pounce - reduces damage from the Defending Pokémon by 10', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    setOpponentAttack(opponent.active.getPokemonCard() as PokemonCard, 30);

    sim.dispatch(new AttackAction(1, 'Pounce'));
    expect(opponent.active.damage).toEqual(30);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(20);
  });

  it('Should use Pounce - reduces damage after applying Weakness', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    setOpponentAttack(opponent.active.getPokemonCard() as PokemonCard, 20, [CardType.FIGHTING]);

    sim.dispatch(new AttackAction(1, 'Pounce'));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    // 20 x2 = 40, -10 = 30
    expect(player.active.damage).toEqual(30);
  });

  it('Should use Pounce - effect ends when the Defending Pokémon is benched', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    const newActive = new TestPokemon();
    setOpponentAttack(newActive, 30);
    opponent.bench[0] = TestUtils.pokemonSlot([newActive]);

    sim.dispatch(new AttackAction(1, 'Pounce'));
    sim.dispatch(new RetreatAction(2, 0));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(player.active.damage).toEqual(30);
  });

  it('Should use Pounce - the effect ends after the opponent\'s next turn', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    setOpponentAttack(opponent.active.getPokemonCard() as PokemonCard, 30);

    sim.dispatch(new AttackAction(1, 'Pounce'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(player.active.damage).toEqual(30);
  });
});
