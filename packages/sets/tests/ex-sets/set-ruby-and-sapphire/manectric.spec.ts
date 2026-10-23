import {
  AttachEnergyPrompt,
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  EnergyType,
  GameMessage,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
  SuperType,
} from '@ptcg/common';

import { LightningEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/lightning-energy';
import { Manectric } from '../../../src/ex-sets/set-ruby-and-sapphire/manectric';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Manectric RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Manectric()], [CardType.LIGHTNING, CardType.LIGHTNING, CardType.COLORLESS]);
  });

  // Attract Current (10) - Search your deck for a L Energy card and attach it to 1 of your Pokémon. Shuffle your
  // deck afterward.
  it('Should use Attract Current - attach Lightning Energy to a Benched Pokemon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const lightning = new LightningEnergy();
    player.deck.cards.push(lightning);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Attract Current'));

    const choose = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    expect(choose).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_ATTACH,
      cards: player.deck,
      filter: { superType: SuperType.ENERGY, energyType: EnergyType.BASIC, name: 'Lightning Energy' },
      options: jasmine.objectContaining({ min: 1, max: 1, allowCancel: true }),
    }));
    sim.dispatch(new ResolvePromptAction(choose.id, [lightning]));

    const attach = TestUtils.lastPrompt(sim) as AttachEnergyPrompt;
    expect(attach).toEqual(jasmine.objectContaining({
      type: 'Attach energy',
      playerId: player.id,
      playerType: PlayerType.BOTTOM_PLAYER,
      slots: [SlotType.ACTIVE, SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(attach.id, [{ to: TestUtils.target(sim, player.bench[0]), card: lightning }]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(player.bench[0].energies.cards).toEqual([lightning]);
    expect(player.deck.cards).not.toContain(lightning);
  });

  it('Should use Attract Current - canceled', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.deck.cards.push(new LightningEnergy());

    sim.dispatch(new AttackAction(1, 'Attract Current'));

    const choose = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(choose.id, null));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(player.deck.cards.length).toEqual(51);
  });

  // Thunder Jolt (50) - Flip a coin. If tails, Manectric does 10 damage to itself.
  it('Should use Thunder Jolt - heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Thunder Jolt'));

    expect(opponent.active.damage).toEqual(50);
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Thunder Jolt - tails', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Thunder Jolt'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
    expect(player.active.damage).toEqual(10);
  });

});
