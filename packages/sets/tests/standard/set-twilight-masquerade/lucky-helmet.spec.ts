import {
  AttackAction,
  Attack,
  CardType,
  PokemonCard,
  Simulator,
} from '@ptcg/common';

import { LuckyHelmet } from '../../../src/standard/set-twilight-masquerade/lucky-helmet';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class ZeroDamageAttacker extends PokemonCard {
  public cardTypes: CardType[] = [];
  public hp = 100;
  public attacks: Attack[] = [{ name: 'Growl', cost: [], damage: '', text: '' }];
  public set = 'TEST';
  public name = 'Zero Attacker';
  public fullName = 'Zero Attacker TEST';
}

describe('Lucky Helmet TWM', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  it('draws 2 cards when the Active Pokémon is damaged by an attack', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.active.trainers.cards = [new LuckyHelmet()];
    const handBefore = opponent.hand.cards.length;
    const deckBefore = opponent.deck.cards.length;
    sim.dispatch(new AttackAction(1, 'Test attack'));
    expect(opponent.active.damage).toEqual(10);
    // +2 from Lucky Helmet; the opponent then also draws for their turn.
    expect(opponent.deck.cards.length).toEqual(deckBefore - 3);
    expect(opponent.hand.cards.length).toEqual(handBefore + 3);
  });

  it('draws 2 cards even if the Pokémon is Knocked Out', () => {
    const { opponent } = TestUtils.getAll(sim);
    const defender = new TestPokemon();
    defender.hp = 10;
    opponent.active.pokemons.cards = [defender];
    opponent.active.trainers.cards = [new LuckyHelmet()];
    opponent.bench[0].pokemons.cards = [new TestPokemon()];
    const deckBefore = opponent.deck.cards.length;
    sim.dispatch(new AttackAction(1, 'Test attack'));
    expect(opponent.deck.cards.length).toBeLessThanOrEqual(deckBefore - 2);
  });

  it('does nothing when the attack does no damage', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new ZeroDamageAttacker()]);
    opponent.active.trainers.cards = [new LuckyHelmet()];
    const deckBefore = opponent.deck.cards.length;
    sim.dispatch(new AttackAction(1, 'Growl'));
    // Only the normal draw for the opponent's turn.
    expect(opponent.deck.cards.length).toEqual(deckBefore - 1);
  });

  it('does nothing on a Benched Pokémon', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.bench[0].pokemons.cards = [new TestPokemon()];
    opponent.bench[0].trainers.cards = [new LuckyHelmet()];
    const deckBefore = opponent.deck.cards.length;
    sim.dispatch(new AttackAction(1, 'Test attack'));
    expect(opponent.deck.cards.length).toEqual(deckBefore - 1);
  });
});
