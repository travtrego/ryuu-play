import { Player, PokemonCard, State } from '@ptcg/common';
import { stateToCoachSnapshot } from './state-to-coach-snapshot';

class TestPokemon extends PokemonCard {
  public set = 'TST';
  public name: string;
  public fullName: string;

  constructor(name: string) {
    super();
    this.name = name;
    this.fullName = `${name} TST`;
    this.hp = 100;
  }
}

describe('stateToCoachSnapshot', () => {
  it('shows the viewer hand while hiding opponent hand contents', () => {
    const state = new State();
    state.turn = 3;
    state.activePlayer = 1;

    const viewer = new Player();
    viewer.id = 1;
    viewer.name = 'Viewer';
    viewer.hand.cards.push(new TestPokemon('Viewer Secret Card'));
    viewer.active.pokemons.cards.push(new TestPokemon('Viewer Active'));

    const opponent = new Player();
    opponent.id = 2;
    opponent.name = 'Opponent';
    opponent.hand.cards.push(new TestPokemon('Opponent Secret Card'));
    opponent.active.pokemons.cards.push(new TestPokemon('Opponent Active'));

    state.players = [viewer, opponent];

    const snapshot = stateToCoachSnapshot(state, viewer.id);

    expect(snapshot.self.hand.map(card => card.name)).toEqual(['Viewer Secret Card']);
    expect(snapshot.opponent.handCount).toBe(1);
    expect(Object.prototype.hasOwnProperty.call(snapshot.opponent, 'hand')).toBe(false);
    expect(JSON.stringify(snapshot)).not.toContain('Opponent Secret Card');
    expect(snapshot.opponent.active?.pokemon.name).toBe('Opponent Active');
  });

  it('rejects a viewer that is not part of the game', () => {
    const state = new State();
    state.players = [new Player(), new Player()];

    expect(() => stateToCoachSnapshot(state, 999)).toThrowError(
      'Player 999 does not exist in this game state.'
    );
  });
});
