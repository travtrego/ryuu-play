import {
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
  Stage,
  SuperType,
} from '@ptcg/common';

import { Revive } from '../../../src/base-sets/set-base/revive';
import { Abra } from '../../../src/base-sets/set-base/abra';
import { Charmander } from '../../../src/base-sets/set-base/charmander';
import { Charmeleon } from '../../../src/base-sets/set-base/charmeleon';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Revive BS', () => {
  let sim: Simulator;
  let trainerCard: Revive;
  let charmander: Charmander;
  let charmeleon: Charmeleon;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new Revive();
    charmander = new Charmander();
    charmeleon = new Charmeleon();
    const player = sim.store.state.players[0];
    player.hand.cards = [trainerCard];
    player.discard.cards = [charmeleon, charmander];
  });

  it('Should put a Basic Pokémon onto the Bench with damage equal to half its HP rounded down', () => {
    const { player, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_PUT_ONTO_BENCH,
      cards: player.discard,
      filter: { superType: SuperType.POKEMON, stage: Stage.BASIC },
      options: jasmine.objectContaining({ min: 1, max: 1 }),
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [charmander]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.bench[0].pokemons.cards).toEqual([charmander]);
    // 50 HP -> 25 -> rounded down to 20
    expect(player.bench[0].damage).toEqual(20);
    expect(player.discard.cards).toEqual(jasmine.arrayWithExactContents([charmeleon, trainerCard]));
  });

  it('Should round 30 HP down to 10 damage', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const abra = new Abra();
    player.discard.cards = [abra];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [abra]));

    expect(player.bench[0].pokemons.cards).toEqual([abra]);
    expect(player.bench[0].damage).toEqual(10);
  });

  it('Should not be playable when the Bench is full', () => {
    const { player } = TestUtils.getAll(sim);
    for (let i = 0; i < 5; i++) {
      player.bench[i] = TestUtils.pokemonSlot([new TestPokemon()]);
    }

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards).toEqual([trainerCard]);
  });

  it('Should not be playable without a Basic Pokémon in the discard pile', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.discard.cards = [charmeleon];
    opponent.discard.cards = [new Charmander()];

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards).toEqual([trainerCard]);
  });
});
