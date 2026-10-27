import {
  AttackAction,
  CardType,
  GameMessage,
  PassTurnAction,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { RescueEnergy } from '../../../src/standard/set-black-and-white/rescue-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class Hitter extends TestPokemon {
  public attacks = [
    { name: 'Big hit', cost: [], damage: '200', text: '' },
  ];
}

describe('Rescue Energy TRM', () => {
  let sim: Simulator;
  let energyCard: RescueEnergy;
  let pokemonCard: TestPokemon;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 3;
    energyCard = new RescueEnergy();
    pokemonCard = new TestPokemon();
    pokemonCard.hp = 60;
    TestUtils.setActive(sim, [pokemonCard]);
    sim.store.state.players[0].active.energies.cards = [energyCard];
    TestUtils.setDefending(sim, [new Hitter()]);
  });

  // Resolves the prompts that follow a Knock Out.
  function resolveKnockOutPrompts() {
    const { player, opponent } = TestUtils.getAll(sim);
    const promote = TestUtils.lastPrompt(sim, player);
    if (promote !== undefined && promote.type === 'Choose pokemon' && promote.result === undefined) {
      sim.dispatch(new ResolvePromptAction(promote.id, [player.bench[0]]));
    }
    const prize = TestUtils.lastPrompt(sim, opponent);
    if (prize !== undefined && prize.type === 'Choose prize' && prize.result === undefined) {
      sim.dispatch(new ResolvePromptAction(prize.id, opponent.prizes.slice(0, 1)));
    }
  }

  it('Should provide Colorless Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    pokemonCard.attacks[0].cost = [CardType.COLORLESS];

    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(opponent.active.damage).toEqual(10);
  });

  it('Should not provide typed Energy', () => {
    pokemonCard.attacks[0].cost = [CardType.FIRE];

    let message = '';
    try {
      sim.dispatch(new AttackAction(1, 'Test attack'));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.NOT_ENOUGH_ENERGY);
  });

  // If the Pokemon this card is attached to is Knocked Out by damage from an attack, put that Pokemon back
  // into your hand. (Discard all cards attached to that Pokemon.)
  it('Should return the Knocked Out Pokemon to your hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.hand.cards = [];

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Big hit'));
    resolveKnockOutPrompts();

    expect(player.hand.cards).toContain(pokemonCard);
    expect(player.discard.cards).not.toContain(pokemonCard);
    // The attached Energy is still discarded
    expect(player.discard.cards).toContain(energyCard);
  });

  it('Should not return a Pokemon that is not holding Rescue Energy', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.energies.cards = [];
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.hand.cards = [];

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Big hit'));
    resolveKnockOutPrompts();

    expect(player.hand.cards).not.toContain(pokemonCard);
    expect(player.discard.cards).toContain(pokemonCard);
  });
});
