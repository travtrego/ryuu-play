import {
  AttackAction,
  CardType,
  GameMessage,
  PlayCardAction,
  Player,
  Simulator,
  TrainerCard,
  TrainerType,
} from '@ptcg/common';

import { Armaldo } from '../../../src/ex-sets/set-sandstorm/armaldo';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

class TestSupporter extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;
  public set = 'TEST';
  public name = 'Test Supporter';
  public fullName = 'Test Supporter TEST';
}

describe('Armaldo SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Armaldo()],
      [CardType.FIGHTING, CardType.FIGHTING, CardType.COLORLESS]
    );
  });

  function playSupporter(owner: Player): string {
    owner.hand.cards = [new TestSupporter()];
    TestUtils.setActivePlayer(sim, owner);
    let message = '';
    try {
      sim.dispatch(new PlayCardAction(owner.id, 0, TestUtils.target(sim, owner.active, owner)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Primal Veil - As long as Armaldo is your Active Pokémon, each player can't play any Supporter Cards.
  it('Should block its owner from playing Supporter cards', () => {
    const { player } = TestUtils.getAll(sim);

    expect(playSupporter(player)).toEqual(GameMessage.BLOCKED_BY_ABILITY);
    expect(player.hand.cards.length).toEqual(1);
    expect(player.supporter.cards).toEqual([]);
  });

  it('Should block the opponent from playing Supporter cards', () => {
    const { opponent } = TestUtils.getAll(sim);

    expect(playSupporter(opponent)).toEqual(GameMessage.BLOCKED_BY_ABILITY);
    expect(opponent.hand.cards.length).toEqual(1);
    expect(opponent.supporter.cards).toEqual([]);
  });

  it('Should not block Supporter cards when Armaldo is on the Bench', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TestPokemon()]);
    player.bench[0] = TestUtils.pokemonSlot([new Armaldo()]);

    expect(playSupporter(player)).toEqual('');
    expect(player.hand.cards).toEqual([]);
    expect(player.supporter.cards.length).toEqual(1);
  });

  it('Should not block Supporter cards when Primal Veil is blocked', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    expect(playSupporter(player)).toEqual('');
    expect(player.supporter.cards.length).toEqual(1);
  });

  // Blade Arms (60)
  it('Should use Blade Arms', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Blade Arms'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });
});
