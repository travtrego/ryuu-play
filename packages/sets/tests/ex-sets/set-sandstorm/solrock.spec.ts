import {
  AttackAction,
  CardType,
  CheckPokemonTypeEffect,
  GameMessage,
  PassTurnAction,
  Simulator,
  SpecialCondition,
  UseAbilityAction,
} from '@ptcg/common';

import { Lunatone } from '../../../src/ex-sets/set-sandstorm/lunatone';
import { Solrock } from '../../../src/ex-sets/set-sandstorm/solrock';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Solrock SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Solrock()],
      [CardType.FIGHTING, CardType.COLORLESS, CardType.COLORLESS]
    );
    sim.store.state.players[0].bench[0] = TestUtils.pokemonSlot([new Lunatone()]);
  });

  function getTypes(): CardType[] {
    const { player } = TestUtils.getAll(sim);
    const check = new CheckPokemonTypeEffect(player.active);
    sim.store.reduceEffect(sim.store.state, check);
    return check.cardTypes;
  }

  function useSolarEclipse(): string {
    const { player } = TestUtils.getAll(sim);
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Solar Eclipse', TestUtils.target(sim, player.active)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Solar Eclipse - Once during your turn (before your attack), if Lunatone is in play, you may use this power.
  // Until the end of your turn, Solrock's type is R. This power can't be used if Solrock is affected by a Special
  // Condition.
  it('Should use Solar Eclipse and become Fire type', () => {
    const { player } = TestUtils.getAll(sim);
    expect(getTypes()).toEqual([CardType.FIGHTING]);

    expect(useSolarEclipse()).toEqual('');

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(getTypes()).toEqual([CardType.FIRE]);
  });

  it('Should apply Weakness to Fire after Solar Eclipse', () => {
    const { opponent } = TestUtils.getAll(sim);
    const defending = new TestPokemon();
    defending.weakness = [{ type: CardType.FIRE }];
    TestUtils.setDefending(sim, [defending]);

    useSolarEclipse();
    sim.dispatch(new AttackAction(1, 'Solar Blast'));

    expect(opponent.active.damage).toEqual(80);
  });

  it('Should go back to Fighting type at the end of the turn', () => {
    useSolarEclipse();
    sim.dispatch(new PassTurnAction(1));

    expect(getTypes()).toEqual([CardType.FIGHTING]);
  });

  it('Should use Solar Eclipse only once per turn', () => {
    expect(useSolarEclipse()).toEqual('');
    expect(useSolarEclipse()).toEqual(GameMessage.POWER_ALREADY_USED);
  });

  it('Should not use Solar Eclipse without Lunatone in play', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    expect(useSolarEclipse()).toEqual(GameMessage.CANNOT_USE_POWER);
    expect(getTypes()).toEqual([CardType.FIGHTING]);
  });

  it('Should not use Solar Eclipse when affected by a Special Condition', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.addSpecialCondition(SpecialCondition.POISONED);

    expect(useSolarEclipse()).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  // Only the owner's own Lunatone counts. "if Lunatone is in play" reads as either side, but that
  // wording is a translation error:
  //   Q. Solrock's "Solar Eclipse" power says "If Lunatone is in play..." Does this count for ANY Lunatone
  //      (yours or opponent's) or only your own?
  //   A. No. There was an error in translation that left it vague - a player must have both of them in play on
  //      their side, to use those Poke-Powers. (Sep 26, 2003 PUI Rules Team)
  it('Should not use Solar Eclipse when only the opponent has Lunatone in play', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[0] = TestUtils.pokemonSlot([new Lunatone()]);

    expect(useSolarEclipse()).toEqual(GameMessage.CANNOT_USE_POWER);
    expect(getTypes()).toEqual([CardType.FIGHTING]);
  });

  // Cosmic Draw - If your opponent has any Evolved Pokémon in play, draw 3 cards.
  it('Should use Cosmic Draw when the opponent has an Evolved Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestPokemon(), new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Cosmic Draw'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards.length).toEqual(3);
  });

  it('Should use Cosmic Draw when the opponent has no Evolved Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Cosmic Draw'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards.length).toEqual(0);
  });

  // Solar Blast (40)
  it('Should use Solar Blast', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Solar Blast'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });
});
