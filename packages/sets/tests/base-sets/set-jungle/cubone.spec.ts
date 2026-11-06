import {
  AttackAction,
  CardType,
  PassTurnAction,
  PokemonCard,
  RetreatAction,
  Simulator,
} from '@ptcg/common';

import { Cubone } from '../../../src/base-sets/set-jungle/cubone';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Cubone JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Cubone()],
      [CardType.FIGHTING, CardType.FIGHTING],
    );
  });

  function setOpponentAttack(slotCard: PokemonCard, damage: number, cardTypes: CardType[] = []) {
    slotCard.attacks[0].damage = String(damage);
    slotCard.cardTypes = cardTypes;
  }

  // Snivel - If the Defending Pokémon attacks Cubone during your opponent's next turn, any damage done by the
  // attack is reduced by 20 (after applying Weakness and Resistance). (Benching either Pokémon ends this effect.)
  it('Should use Snivel - reduces damage from the Defending Pokémon by 20', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    setOpponentAttack(opponent.active.getPokemonCard() as PokemonCard, 30);

    sim.dispatch(new AttackAction(1, 'Snivel'));
    expect(opponent.active.damage).toEqual(0);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
  });

  it('Should use Snivel - reduces damage after applying Weakness', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    setOpponentAttack(opponent.active.getPokemonCard() as PokemonCard, 10, [CardType.GRASS]);

    sim.dispatch(new AttackAction(1, 'Snivel'));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    // 10 x2 = 20, -20 = 0
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Snivel - effect ends when the Defending Pokémon is benched', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    const newActive = new TestPokemon();
    setOpponentAttack(newActive, 30);
    opponent.bench[0] = TestUtils.pokemonSlot([newActive]);

    sim.dispatch(new AttackAction(1, 'Snivel'));
    sim.dispatch(new RetreatAction(2, 0));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(player.active.damage).toEqual(30);
  });

  it('Should use Snivel - the effect ends after the opponent\'s next turn', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    setOpponentAttack(opponent.active.getPokemonCard() as PokemonCard, 30);

    sim.dispatch(new AttackAction(1, 'Snivel'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(player.active.damage).toEqual(30);
  });

  // Rage (10+) - Does 10 damage plus 10 more damage for each damage counter on Cubone.
  it('Should use Rage without damage counters', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Rage'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should use Rage with 2 damage counters', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.active.damage = 20;

    sim.dispatch(new AttackAction(1, 'Rage'));

    expect(opponent.active.damage).toEqual(30);
  });
});
