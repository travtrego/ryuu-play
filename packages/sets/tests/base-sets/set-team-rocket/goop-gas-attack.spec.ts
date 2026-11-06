import {
  AttackAction,
  CardType,
  GameMessage,
  PassTurnAction,
  PlayCardAction,
  PokemonCard,
  Simulator,
  UseAbilityAction,
} from '@ptcg/common';

import { GoopGasAttack } from '../../../src/base-sets/set-team-rocket/goop-gas-attack';
import { Charmander } from '../../../src/base-sets/set-team-rocket/charmander';
import { Kabuto } from '../../../src/base-sets/set-fossil/kabuto';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Goop Gas Attack TR', () => {
  let sim: Simulator;
  let trainerCard: GoopGasAttack;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new GoopGasAttack();
    const { player, opponent } = TestUtils.getAll(sim);
    player.hand.cards = [trainerCard];

    // Both players have Charmander (Gather Fire) with a R Energy on a Benched Pokémon
    TestUtils.setActive(sim, [new Charmander()]);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [CardType.FIRE]);
    TestUtils.setDefending(sim, [new Charmander()]);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [CardType.FIRE]);
  });

  function useGatherFire(clientId: number): string {
    const { player, opponent } = TestUtils.getAll(sim);
    const owner = clientId === 1 ? player : opponent;
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(clientId, 'Gather Fire', TestUtils.target(sim, owner.active, owner)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // All Pokémon Powers stop working until the end of your opponent's next turn.
  it('Should allow Pokémon Powers before it is played', () => {
    const { prompts } = TestUtils.getAll(sim);
    expect(useGatherFire(1)).toEqual('');
    expect(prompts.some(p => p.type === 'Move energy')).toBeTrue();
  });

  it('Should stop your own Pokémon Powers this turn', () => {
    const { player } = TestUtils.getAll(sim);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(player.discard.cards).toEqual([trainerCard]);
    expect(useGatherFire(1)).toEqual(GameMessage.BLOCKED_BY_EFFECT);
  });

  it('Should stop the opponent\'s passive Pokémon Powers this turn', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const kabuto = new Kabuto();
    kabuto.hp = 400;
    kabuto.weakness = [];
    TestUtils.setActive(sim, [new TestPokemon()]);
    TestUtils.setDefending(sim, [kabuto]);
    (player.active.getPokemonCard() as PokemonCard).attacks[0].damage = '40';

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new AttackAction(1, 'Test attack'));

    // Kabuto Armor would halve the damage
    expect(opponent.active.damage).toEqual(40);
  });

  it('Should stop Pokémon Powers during the opponent\'s next turn', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new PassTurnAction(1));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(useGatherFire(2)).toEqual(GameMessage.BLOCKED_BY_EFFECT);
  });

  it('Should let Pokémon Powers work again after the opponent\'s next turn', () => {
    const { player, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new PassTurnAction(2));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(useGatherFire(1)).toEqual('');
    expect(prompts.some(p => p.type === 'Move energy')).toBeTrue();
  });
});
