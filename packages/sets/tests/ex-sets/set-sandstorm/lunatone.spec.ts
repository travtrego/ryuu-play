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

describe('Lunatone SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Lunatone()], [CardType.PSYCHIC, CardType.COLORLESS]);
    sim.store.state.players[0].bench[0] = TestUtils.pokemonSlot([new Solrock()]);
  });

  function getTypes(): CardType[] {
    const { player } = TestUtils.getAll(sim);
    const check = new CheckPokemonTypeEffect(player.active);
    sim.store.reduceEffect(sim.store.state, check);
    return check.cardTypes;
  }

  function useLunarEclipse(): string {
    const { player } = TestUtils.getAll(sim);
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Lunar Eclipse', TestUtils.target(sim, player.active)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Lunar Eclipse - Once during your turn (before your attack), if Solrock is in play, you may use this power.
  // Until the end of your turn, Lunatone's type is D. This power can't be used if Lunatone is affected by a Special
  // Condition.
  it('Should use Lunar Eclipse and become Darkness type', () => {
    const { player } = TestUtils.getAll(sim);
    expect(getTypes()).toEqual([CardType.PSYCHIC]);

    expect(useLunarEclipse()).toEqual('');

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(getTypes()).toEqual([CardType.DARK]);
  });

  it('Should apply Weakness to Darkness after Lunar Eclipse', () => {
    const { opponent } = TestUtils.getAll(sim);
    const defending = new TestPokemon();
    defending.weakness = [{ type: CardType.DARK }];
    TestUtils.setDefending(sim, [defending]);

    useLunarEclipse();
    sim.dispatch(new AttackAction(1, 'Lunar Blast'));

    expect(opponent.active.damage).toEqual(60);
  });

  it('Should go back to Psychic type at the end of the turn', () => {
    useLunarEclipse();
    sim.dispatch(new PassTurnAction(1));

    expect(getTypes()).toEqual([CardType.PSYCHIC]);
  });

  it('Should use Lunar Eclipse only once per turn', () => {
    expect(useLunarEclipse()).toEqual('');
    expect(useLunarEclipse()).toEqual(GameMessage.POWER_ALREADY_USED);
  });

  it('Should not use Lunar Eclipse without Solrock in play', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    expect(useLunarEclipse()).toEqual(GameMessage.CANNOT_USE_POWER);
    expect(getTypes()).toEqual([CardType.PSYCHIC]);
  });

  it('Should not use Lunar Eclipse when affected by a Special Condition', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.addSpecialCondition(SpecialCondition.CONFUSED);

    expect(useLunarEclipse()).toEqual(GameMessage.CANNOT_USE_POWER);
    expect(getTypes()).toEqual([CardType.PSYCHIC]);
  });

  // Only the owner's own Solrock counts. "if Solrock is in play" reads as either side, but that
  // wording is a translation error:
  //   Q. Lunatone's "Lunar Eclipse" power says "If Solrock is in play..." Does this count for ANY Solrock
  //      (yours or opponent's) or only your own?
  //   A. No. There was an error in translation that left it vague - a player must have both of them in play on
  //      their side, to use those Poke-Powers. (Sep 26, 2003 PUI Rules Team)
  it('Should not use Lunar Eclipse when only the opponent has Solrock in play', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[0] = TestUtils.pokemonSlot([new Solrock()]);

    expect(useLunarEclipse()).toEqual(GameMessage.CANNOT_USE_POWER);
    expect(getTypes()).toEqual([CardType.PSYCHIC]);
  });

  // Cosmic Draw - If your opponent has any Evolved Pokémon in play, draw 3 cards.
  it('Should use Cosmic Draw when the opponent has an Evolved Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon(), new TestPokemon()]);

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

  // Lunar Blast (30)
  it('Should use Lunar Blast', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Lunar Blast'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });
});
