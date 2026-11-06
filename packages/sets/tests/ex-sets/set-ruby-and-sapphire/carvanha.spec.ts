import {
  AttackAction,
  CardType,
  GameMessage,
  PassTurnAction,
  PokemonCard,
  RetreatAction,
  Simulator,
} from '@ptcg/common';

import { Carvanha } from '../../../src/ex-sets/set-ruby-and-sapphire/carvanha';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Carvanha RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Carvanha()], [CardType.COLORLESS]);
  });

  // Rough Skin - If Carvanha is your Active Pokémon and is damaged by an opponent's attack (even if Carvanha is
  // Knocked Out), put 1 damage counter on the Attacking Pokémon.
  it('Should use Rough Skin - damage counter on the Attacking Pokemon', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should use Rough Skin - even if Carvanha is Knocked Out', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    const attacker = opponent.active.getPokemonCard() as PokemonCard;
    attacker.attacks = [{ name: 'Big attack', cost: [], damage: '50', text: '' }];

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Big attack'));

    expect(player.discard.cards.some(c => c instanceof Carvanha)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should use Rough Skin - not when Carvanha is on the Bench', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = player.active;
    player.active = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Rough Skin - power blocked', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(player.active.damage).toEqual(10);
    expect(opponent.active.damage).toEqual(0);
  });

  // Big Bite (10) - The Defending Pokémon can't retreat until the end of your opponent's next turn.
  it('Should use Big Bite - blocks retreat', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Big Bite'));

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

  it('Should use Big Bite - effect ends after opponent\'s next turn', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    const defending = opponent.active;

    sim.dispatch(new AttackAction(1, 'Big Bite'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new RetreatAction(2, 0));

    expect(opponent.bench[0]).toBe(defending);
  });

});
