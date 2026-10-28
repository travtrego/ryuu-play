import { State, Player, PokemonSlot, PokemonCard, CardList, SpecialCondition,
  EnergyCard, CardType, Card, deepClone } from '@ptcg/common';
import { describeChanges, joinList, plural } from './explain-utils';

class TestPokemon extends PokemonCard {
  name = 'pokemon';
  fullName = 'pokemon';
  set = 'test';
  constructor(name: string) {
    super();
    this.name = name;
    this.hp = 100;
  }
}

class TestEnergy extends EnergyCard {
  name = 'Water Energy';
  fullName = 'Water Energy';
  set = 'test';
  provides = [ CardType.WATER ];
}

describe('explain-utils', () => {
  let before: State;
  let nextId: number;

  function slotOf(name: string): PokemonSlot {
    const slot = new PokemonSlot();
    const card = new TestPokemon(name);
    card.id = nextId++;
    slot.pokemons.cards = [ card ];
    return slot;
  }

  function createPlayer(id: number, active: string): Player {
    const p = new Player();
    p.id = id;
    p.active = slotOf(active);
    for (let i = 0; i < 5; i++) {
      p.bench.push(new PokemonSlot());
    }
    for (let i = 0; i < 10; i++) {
      const c = new TestEnergy();
      c.id = nextId++;
      p.deck.cards.push(c);
    }
    for (let i = 0; i < 6; i++) {
      const prize = new CardList();
      const c = new TestEnergy();
      c.id = nextId++;
      prize.cards.push(c);
      p.prizes.push(prize);
    }
    return p;
  }

  function after(): State {
    return deepClone(before, [ Card ]);
  }

  beforeEach(() => {
    nextId = 1;
    before = new State();
    before.players = [ createPlayer(1, 'Staryu'), createPlayer(2, 'Geodude') ];
  });

  it('joins lists in plain English', () => {
    expect(joinList([])).toBe('');
    expect(joinList([ 'a' ])).toBe('a');
    expect(joinList([ 'a', 'b', 'c' ])).toBe('a, b and c');
    expect(plural(1, 'card')).toBe('1 card');
    expect(plural(3, 'card')).toBe('3 cards');
    expect(plural(2, 'Energy')).toBe('2 Energy');
  });

  it('reports nothing when nothing changed', () => {
    expect(describeChanges(before, after(), 1)).toEqual([]);
  });

  it('reports cards taken from the deck during the turn', () => {
    const s = after();
    s.players[0].deck.moveTo(s.players[0].hand, 3);
    expect(describeChanges(before, s, 1)).toEqual([ 'gets 3 cards from its deck' ]);
  });

  it('reports damage and Special Conditions on the opponent', () => {
    const s = after();
    s.players[1].active.damage = 30;
    s.players[1].active.specialConditions.push(SpecialCondition.POISONED);
    expect(describeChanges(before, s, 1)).toEqual([
      'puts 30 damage on Geodude',
      'makes Geodude Poisoned'
    ]);
  });

  it('reports healing and a new Active Pokémon', () => {
    before.players[0].active.damage = 40;
    before.players[0].bench[0] = slotOf('Starmie');
    const s = after();
    s.players[0].active.damage = 10;
    s.players[0].switchPokemon(s.players[0].bench[0]);
    expect(describeChanges(before, s, 1)).toEqual([
      'makes Starmie the Active Pokémon',
      'heals 30 damage from Staryu'
    ]);
  });

  it('reports a Pokémon put on the Bench', () => {
    const s = after();
    s.players[0].bench[2] = slotOf('Horsea');
    expect(describeChanges(before, s, 1)).toEqual([ 'puts Horsea on the Bench' ]);
  });

  it('reports Energy removed from the opponent', () => {
    const energy = new TestEnergy();
    energy.id = nextId++;
    before.players[1].active.energies.cards.push(energy);
    const s = after();
    s.players[1].active.energies.cards = [];
    expect(describeChanges(before, s, 1)).toEqual([ 'removes 1 Energy from the opponent' ]);
  });

});
