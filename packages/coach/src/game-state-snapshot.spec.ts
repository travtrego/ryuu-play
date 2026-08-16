import { CardList, EnergyCard, GamePhase, Player, PokemonCard, SpecialCondition, State,
  TrainerCard, TrainerType } from '@ptcg/common';
import { buildGameStateSnapshot } from './game-state-snapshot';

function testPokemon(name: string, hp: number): PokemonCard {
  class TestPokemon extends PokemonCard {
    name = name;
    fullName = name;
    set = 'test';
    hp = hp;
  }
  return new TestPokemon();
}

function testEnergy(name: string): EnergyCard {
  class TestEnergy extends EnergyCard {
    name = name;
    fullName = name;
    set = 'test';
  }
  return new TestEnergy();
}

function testTool(name: string): TrainerCard {
  class TestTool extends TrainerCard {
    name = name;
    fullName = name;
    set = 'test';
    trainerType = TrainerType.TOOL;
  }
  return new TestTool();
}

describe('buildGameStateSnapshot', () => {

  let state: State;
  let you: Player;
  let opponent: Player;

  beforeEach(() => {
    you = new Player();
    you.id = 1;
    you.name = 'You';

    opponent = new Player();
    opponent.id = 2;
    opponent.name = 'Opponent';

    state = new State();
    state.turn = 3;
    state.phase = GamePhase.PLAYER_TURN;
    state.players = [ you, opponent ];
    state.activePlayer = 0;
  });

  it('throws when the viewer is not part of the game', () => {
    expect(() => buildGameStateSnapshot(state, 99)).toThrowError();
  });

  it('reveals the viewer\'s hand but not the opponent\'s', () => {
    you.hand.cards = [ testPokemon('Pikachu', 60) ];
    opponent.hand.cards = [ testPokemon('Mewtwo ex', 130), testPokemon('Bidoof', 60) ];

    const snapshot = buildGameStateSnapshot(state, you.id);

    expect(snapshot.you.handCount).toBe(1);
    expect(snapshot.you.handCardNames).toEqual([ 'Pikachu' ]);
    expect(snapshot.opponent.handCount).toBe(2);
    expect(snapshot.opponent.handCardNames).toBeUndefined();
  });

  it('summarizes the active Pokémon, its energy, tools and special conditions', () => {
    you.active.pokemons.cards = [ testPokemon('Mewtwo ex', 130) ];
    you.active.damage = 40;
    you.active.energies.cards = [ testEnergy('Psychic Energy') ];
    you.active.trainers.cards = [ testTool('Choice Belt') ];
    you.active.addSpecialCondition(SpecialCondition.POISONED);

    const snapshot = buildGameStateSnapshot(state, you.id);

    expect(snapshot.you.active).toEqual({
      pokemonNames: [ 'Mewtwo ex' ],
      hp: 130,
      damage: 40,
      energyNames: [ 'Psychic Energy' ],
      toolNames: [ 'Choice Belt' ],
      specialConditions: [ 'POISONED' ]
    });
  });

  it('reports public information for the opponent: deck size, discard, prizes and board', () => {
    opponent.deck.cards = [ testPokemon('Card 1', 60), testPokemon('Card 2', 60) ];
    opponent.discard.cards = [ testPokemon('Fainted Mon', 60) ];

    const prize = new CardList();
    prize.cards = [ testPokemon('Prize', 60) ];
    opponent.prizes = [ prize ];

    opponent.active.pokemons.cards = [ testPokemon('Dragapult ex', 130) ];

    const snapshot = buildGameStateSnapshot(state, you.id);

    expect(snapshot.opponent.deckCount).toBe(2);
    expect(snapshot.opponent.discardCardNames).toEqual([ 'Fainted Mon' ]);
    expect(snapshot.opponent.prizesLeft).toBe(1);
    expect(snapshot.opponent.active.pokemonNames).toEqual([ 'Dragapult ex' ]);
  });

  it('reports turn, phase and whose turn it is', () => {
    const snapshot = buildGameStateSnapshot(state, you.id);

    expect(snapshot.turn).toBe(3);
    expect(snapshot.phase).toBe('PLAYER_TURN');
    expect(snapshot.activePlayerId).toBe(you.id);
    expect(snapshot.viewerPlayerId).toBe(you.id);
  });

});
