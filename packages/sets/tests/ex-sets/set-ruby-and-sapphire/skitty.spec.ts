import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  EnergyType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
  SuperType,
} from '@ptcg/common';

import { DarknessEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/darkness-energy';
import { FireEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/fire-energy';
import { Skitty } from '../../../src/ex-sets/set-ruby-and-sapphire/skitty';
import { WaterEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/water-energy';
import { TestUtils } from '../../test-utils';

describe('Skitty RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Skitty()], [CardType.COLORLESS]);
  });

  // Minor Errand-Running - Search your deck for 2 basic Energy cards, show them to your opponent, and put them into
  // your hand. Shuffle your deck afterward.
  it('Should use Minor Errand-Running', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const fire = new FireEnergy();
    const water = new WaterEnergy();
    player.deck.cards.push(fire, water, new DarknessEnergy());

    sim.dispatch(new AttackAction(1, 'Minor Errand-Running'));

    const prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      cards: player.deck,
      filter: { superType: SuperType.ENERGY, energyType: EnergyType.BASIC },
      options: jasmine.objectContaining({ min: 0, max: 2 }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [fire, water]));

    const show = TestUtils.lastPrompt(sim);
    expect(show).toEqual(jasmine.objectContaining({ type: 'Show cards', playerId: opponent.id, cards: [fire, water] }));
    sim.dispatch(new ResolvePromptAction((show as ChooseCardsPrompt).id, true));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([fire, water]);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Minor Errand-Running - empty deck', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.deck.cards = [];

    sim.dispatch(new AttackAction(1, 'Minor Errand-Running'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([]);
  });

  // Lullaby (10) - The Defending Pokémon is now Asleep.
  it('Should use Lullaby', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Lullaby'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
  });

});
