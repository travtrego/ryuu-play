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

import { Delcatty2 } from '../../../src/ex-sets/set-ruby-and-sapphire/delcatty-2';
import { TestEnergy } from '../../test-cards/test-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Delcatty RS 2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Delcatty2()], [CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Energy Call (10) - Attach 1 Energy card from your discard pile to your Active Pokémon.
  it('Should use Energy Call - attach Energy from discard', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const energy = new TestEnergy(CardType.FIRE);
    player.discard.cards = [new TestPokemon(), energy];

    sim.dispatch(new AttackAction(1, 'Energy Call'));

    const prompt = TestUtils.lastPrompt(sim) as AttachEnergyPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Attach energy',
      playerId: player.id,
      message: GameMessage.ATTACH_ENERGY_TO_ACTIVE,
      cardList: player.discard,
      playerType: PlayerType.BOTTOM_PLAYER,
      slots: [SlotType.ACTIVE],
      filter: { superType: SuperType.ENERGY },
      options: jasmine.objectContaining({ min: 1, max: 1, allowCancel: false }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [{ to: TestUtils.target(sim, player.active), card: energy }]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(player.active.energies.cards).toContain(energy);
    expect(player.discard.cards.length).toEqual(1);
  });

  it('Should use Energy Call - no Energy in discard', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Energy Call'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  // Cannonball (30+) - Does 30 damage plus 10 more damage for each Energy attached to Delcatty but not used to pay
  // for this attack's Energy cost.
  it('Should use Cannonball - no extra Energy', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Cannonball'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Cannonball - 2 extra Energy', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.energies.cards = TestUtils.makeEnergies([
      CardType.COLORLESS, CardType.COLORLESS, CardType.FIRE, CardType.WATER
    ]);

    sim.dispatch(new AttackAction(1, 'Cannonball'));

    expect(opponent.active.damage).toEqual(50);
  });

});
