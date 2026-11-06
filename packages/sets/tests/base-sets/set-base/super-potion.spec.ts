import {
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { SuperPotion } from '../../../src/base-sets/set-base/super-potion';
import { FireEnergy } from '../../../src/base-sets/set-base/fire-energy';
import { WaterEnergy } from '../../../src/base-sets/set-base/water-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Super Potion BS', () => {
  let sim: Simulator;
  let trainerCard: SuperPotion;
  let fire: FireEnergy;
  let water: WaterEnergy;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new SuperPotion();
    fire = new FireEnergy();
    water = new WaterEnergy();
    const player = sim.store.state.players[0];
    player.hand.cards = [trainerCard];
    player.active.energies.cards = [fire, water];
  });

  it('Should discard 1 Energy card to remove 4 damage counters', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.active.damage = 60;

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      slots: [SlotType.ACTIVE, SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.active]));

    expect(prompts[1]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      message: GameMessage.CHOOSE_CARD_TO_DISCARD,
      cards: player.active.energies,
      options: jasmine.objectContaining({ min: 1, max: 1 }),
    }));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [fire]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(20);
    expect(player.active.energies.cards).toEqual([water]);
    expect(player.discard.cards).toEqual(jasmine.arrayWithExactContents([fire, trainerCard]));
  });

  it('Should remove at most the damage counters present', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.active.damage = 20;

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.active]));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [water]));

    expect(player.active.damage).toEqual(0);
    expect(player.active.energies.cards).toEqual([fire]);
  });

  it('Should not be playable when no damaged Pokémon has Energy attached', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.damage = 0;
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [], [], 50);

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards).toEqual([trainerCard]);
  });

  it('Should keep the card in hand when cancelled', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.active.damage = 60;

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([trainerCard]);
    expect(player.active.damage).toEqual(60);
    expect(player.active.energies.cards).toEqual([fire, water]);
  });
});
