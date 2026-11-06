import {
  AttachEnergyPrompt,
  AttackAction,
  CardType,
  GameMessage,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
  SuperType,
} from '@ptcg/common';

import { DarknessEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/darkness-energy';
import { MewtwoEx } from '../../../src/ex-sets/set-ruby-and-sapphire/mewtwo-ex';
import { PsychicEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/psychic-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Mewtwo ex RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new MewtwoEx()], [CardType.PSYCHIC, CardType.PSYCHIC, CardType.COLORLESS]);
  });

  // Energy Absorption - Attach up to 2 Energy cards from your discard pile to Mewtwo ex.
  it('Should use Energy Absorption - attach 2 Energy cards', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const psychic = new PsychicEnergy();
    const dark = new DarknessEnergy();
    player.discard.cards = [new TestPokemon(), psychic, dark];

    sim.dispatch(new AttackAction(1, 'Energy Absorption'));

    const prompt = TestUtils.lastPrompt(sim) as AttachEnergyPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Attach energy',
      playerId: player.id,
      message: GameMessage.ATTACH_ENERGY_CARDS,
      cardList: player.discard,
      playerType: PlayerType.BOTTOM_PLAYER,
      slots: [SlotType.ACTIVE],
      filter: { superType: SuperType.ENERGY },
      options: jasmine.objectContaining({ min: 1, max: 2, allowCancel: true }),
    }));
    const target = TestUtils.target(sim, player.active);
    sim.dispatch(new ResolvePromptAction(prompt.id, [{ to: target, card: psychic }, { to: target, card: dark }]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(player.active.energies.cards.length).toEqual(5);
    expect(player.active.energies.cards).toContain(psychic);
    expect(player.active.energies.cards).toContain(dark);
    expect(player.discard.cards.length).toEqual(1);
  });

  it('Should use Energy Absorption - canceled', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.discard.cards = [new PsychicEnergy()];

    sim.dispatch(new AttackAction(1, 'Energy Absorption'));

    const prompt = TestUtils.lastPrompt(sim) as AttachEnergyPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, null));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.energies.cards.length).toEqual(3);
  });

  it('Should use Energy Absorption - no Energy in discard', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.discard.cards = [new TestPokemon()];

    sim.dispatch(new AttackAction(1, 'Energy Absorption'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.energies.cards.length).toEqual(3);
  });

  // Psyburn (60)
  it('Should use Psyburn', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Psyburn'));

    expect(opponent.active.damage).toEqual(60);
  });

});
