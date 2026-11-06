import {
  AttachEnergyPrompt,
  AttackAction,
  CardType,
  EnergyType,
  GameMessage,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
  SuperType,
} from '@ptcg/common';

import { DarknessEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/darkness-energy';
import { FireEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/fire-energy';
import { Skitty2 } from '../../../src/ex-sets/set-ruby-and-sapphire/skitty-2';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Skitty RS 2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Skitty2()], [CardType.COLORLESS]);
  });

  // Plus Energy - Attach a basic Energy card from your hand to 1 of your Pokémon.
  it('Should use Plus Energy - attach to the Active Pokemon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const fire = new FireEnergy();
    player.hand.cards = [new DarknessEnergy(), fire];

    sim.dispatch(new AttackAction(1, 'Plus Energy'));

    const prompt = TestUtils.lastPrompt(sim) as AttachEnergyPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Attach energy',
      playerId: player.id,
      message: GameMessage.ATTACH_ENERGY_CARDS,
      cardList: player.hand,
      playerType: PlayerType.BOTTOM_PLAYER,
      filter: { superType: SuperType.ENERGY, energyType: EnergyType.BASIC },
      options: jasmine.objectContaining({ min: 1, max: 1 }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [{ to: TestUtils.target(sim, player.active), card: fire }]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.energies.cards).toContain(fire);
    expect(player.hand.cards).not.toContain(fire);
  });

  it('Should use Plus Energy - attach to a Benched Pokemon', () => {
    const { player } = TestUtils.getAll(sim);
    const fire = new FireEnergy();
    player.hand.cards = [fire];
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Plus Energy'));

    const prompt = TestUtils.lastPrompt(sim) as AttachEnergyPrompt;
    expect(prompt.slots).toEqual([SlotType.ACTIVE, SlotType.BENCH]);
    sim.dispatch(new ResolvePromptAction(prompt.id, [{ to: TestUtils.target(sim, player.bench[0]), card: fire }]));

    expect(player.bench[0].energies.cards).toEqual([fire]);
  });

  it('Should use Plus Energy - no basic Energy in hand', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.hand.cards = [new DarknessEnergy()];

    sim.dispatch(new AttackAction(1, 'Plus Energy'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.energies.cards.length).toEqual(1);
  });

  // Scratch (10)
  it('Should use Scratch', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Scratch'));

    expect(opponent.active.damage).toEqual(10);
  });

});
