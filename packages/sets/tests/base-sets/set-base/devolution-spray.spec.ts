import {
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { DevolutionSpray } from '../../../src/base-sets/set-base/devolution-spray';
import { Charizard } from '../../../src/base-sets/set-base/charizard';
import { Charmander } from '../../../src/base-sets/set-base/charmander';
import { Charmeleon } from '../../../src/base-sets/set-base/charmeleon';
import { TestUtils } from '../../test-utils';

describe('Devolution Spray BS', () => {
  let sim: Simulator;
  let trainerCard: DevolutionSpray;
  let charmander: Charmander;
  let charmeleon: Charmeleon;
  let charizard: Charizard;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new DevolutionSpray();
    charmander = new Charmander();
    charmeleon = new Charmeleon();
    charizard = new Charizard();
    sim.store.state.players[0].hand.cards = [trainerCard];
    TestUtils.setActive(sim, [charmander, charmeleon, charizard]);
  });

  it('Should discard the chosen Stage and higher and remove Special Conditions', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.active.damage = 30;
    player.active.addSpecialCondition(SpecialCondition.ASLEEP);
    player.active.addSpecialCondition(SpecialCondition.POISONED);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    expect(prompts[0]).toEqual(jasmine.objectContaining({ type: 'Choose pokemon', playerId: player.id }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.active]));

    expect(prompts[1]).toEqual(jasmine.objectContaining({ type: 'Choose cards', playerId: player.id }));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [charmeleon]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.pokemons.cards).toEqual([charmander]);
    expect(player.active.specialConditions).toEqual([]);
    expect(player.active.damage).toEqual(30);
    expect(player.discard.cards).toEqual(jasmine.arrayWithExactContents([trainerCard, charmeleon, charizard]));
  });

  it('Should discard only the Stage 2 card when Stage 2 is chosen', () => {
    const { player, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.active]));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [charizard]));

    expect(player.active.pokemons.cards).toEqual([charmander, charmeleon]);
    expect(player.discard.cards).toEqual(jasmine.arrayWithExactContents([trainerCard, charizard]));
  });

  it('Should not be playable when you have no evolved Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Charmander()]);

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
