import {
  AttackAction,
  CardType,
  PassTurnAction,
  PlayCardAction,
  Simulator,
} from '@ptcg/common';

import { GrassEnergy } from '../../../src/base-sets/set-base/grass-energy';
import { Shuckle } from '../../../src/standard/set-black-and-white/shuckle';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

class Hitter extends TestPokemon {
  public hp = 300;

  public attacks = [
    { name: 'Hit', cost: [], damage: '30', text: '' },
  ];
}

describe('Shuckle PR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Shuckle()], [CardType.GRASS, CardType.COLORLESS]);
  });

  // Fermenting Liquid - Whenever you attach an Energy card from your hand to Shuckle, draw a card.
  it('Should draw a card when an Energy is attached to Shuckle from hand', () => {
    const { player } = TestUtils.getAll(sim);
    const grass = new GrassEnergy();
    player.hand.cards = [grass];
    player.energyPlayedTurn = -1;
    const deckBefore = player.deck.cards.length;

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.energies.cards).toContain(grass);
    // Hand is empty after attaching, then 1 card is drawn
    expect(player.hand.cards.length).toEqual(1);
    expect(player.deck.cards.length).toEqual(deckBefore - 1);
  });

  it('Should not draw when the Energy is attached to another Pokemon', () => {
    const { player } = TestUtils.getAll(sim);
    const grass = new GrassEnergy();
    player.hand.cards = [grass];
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.energyPlayedTurn = -1;
    const deckBefore = player.deck.cards.length;

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.bench[0])));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.bench[0].energies.cards).toContain(grass);
    expect(player.hand.cards.length).toEqual(0);
    expect(player.deck.cards.length).toEqual(deckBefore);
  });

  it('Should not draw when Fermenting Liquid is blocked', () => {
    const { player } = TestUtils.getAll(sim);
    const grass = new GrassEnergy();
    player.hand.cards = [grass];
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);
    player.energyPlayedTurn = -1;
    const deckBefore = player.deck.cards.length;

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect(player.active.energies.cards).toContain(grass);
    expect(player.deck.cards.length).toEqual(deckBefore);
  });

  // Shell Stunner (20) - Flip a coin. If heads, prevent all damage done to Shuckle by attacks during your
  // opponent's next turn.
  it('Should use Shell Stunner - heads, prevents damage next turn', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);
    TestUtils.setDefending(sim, [new Hitter()]);

    sim.dispatch(new AttackAction(1, 'Shell Stunner'));
    expect(opponent.active.damage).toEqual(20);

    sim.dispatch(new AttackAction(2, 'Hit'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Shell Stunner - tails, damage is not prevented', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);
    TestUtils.setDefending(sim, [new Hitter()]);

    sim.dispatch(new AttackAction(1, 'Shell Stunner'));
    expect(opponent.active.damage).toEqual(20);

    sim.dispatch(new AttackAction(2, 'Hit'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(30);
  });

  it('Should use Shell Stunner - protection only lasts one turn', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);
    TestUtils.setDefending(sim, [new Hitter()]);

    sim.dispatch(new AttackAction(1, 'Shell Stunner'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Hit'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(30);
  });
});
