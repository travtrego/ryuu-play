import {
  AttackAction,
  CardType,
  PassTurnAction,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { Defender } from '../../../src/base-sets/set-base/defender';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Defender BS', () => {
  let sim: Simulator;
  let trainerCard: Defender;
  let attacker: TestPokemon;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new Defender();
    sim.store.state.players[0].hand.cards = [trainerCard];
    attacker = new TestPokemon();
    attacker.attacks[0].damage = '30';
    TestUtils.setDefending(sim, [attacker]);
  });

  function attachDefenderToActive() {
    const { player, prompts } = TestUtils.getAll(sim);
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      slots: [SlotType.ACTIVE, SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.active]));
  }

  it('Should attach to 1 of your Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(sim.store.state.prompts[0].id, [player.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.bench[0].trainers.cards).toEqual([trainerCard]);
    expect(player.hand.cards).toEqual([]);
    expect(player.discard.cards).toEqual([]);
  });

  it('Should reduce attack damage by 20 during the opponent\'s next turn', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    attachDefenderToActive();
    sim.dispatch(new PassTurnAction(1));
    expect(player.active.trainers.cards).toEqual([trainerCard]); // still attached

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should reduce damage after applying Weakness', () => {
    const { player } = TestUtils.getAll(sim);
    attacker.cardTypes = [CardType.FIRE];
    (player.active.getPokemonCard() as TestPokemon).weakness = [{ type: CardType.FIRE }];
    attachDefenderToActive();
    sim.dispatch(new PassTurnAction(1));

    sim.dispatch(new AttackAction(2, 'Test attack'));

    // 30 x2 = 60, minus 20
    expect(player.active.damage).toEqual(40);
  });

  it('Should be discarded at the end of the opponent\'s next turn', () => {
    const { player } = TestUtils.getAll(sim);
    attachDefenderToActive();
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new PassTurnAction(2));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.trainers.cards).toEqual([]);
    expect(player.discard.cards).toEqual([trainerCard]);
  });
});
