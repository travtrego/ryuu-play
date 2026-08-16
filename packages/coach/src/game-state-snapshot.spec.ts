import { CardList, ChooseCardsPrompt, ConfirmPrompt, EnergyCard, GameMessage, GamePhase, Player,
  PokemonCard, PokemonSlot, SpecialCondition, State, SuperType, TrainerCard,
  TrainerType } from '@ptcg/common';
import { buildGameStateSnapshot } from './game-state-snapshot';

// Player ids are deliberately not 0 or 1. state.activePlayer is an index into
// state.players, so any test using ids that collide with array positions would
// pass just as happily against an implementation that confuses the two.
const VIEWER_ID = 101;
const OPPONENT_ID = 202;

function testPokemon(name: string, hp: number): PokemonCard {
  class TestPokemon extends PokemonCard {
    name = name;
    fullName = `${name} TST`;
    set = 'TST';
    hp = hp;
  }
  return new TestPokemon();
}

function testEnergy(name: string): EnergyCard {
  class TestEnergy extends EnergyCard {
    name = name;
    fullName = `${name} TST`;
    set = 'TST';
  }
  return new TestEnergy();
}

function testTool(name: string): TrainerCard {
  class TestTool extends TrainerCard {
    name = name;
    fullName = `${name} TST`;
    set = 'TST';
    trainerType = TrainerType.TOOL;
  }
  return new TestTool();
}

function slotWith(pokemon: PokemonCard): PokemonSlot {
  const slot = new PokemonSlot();
  slot.pokemons.cards = [ pokemon ];
  return slot;
}

describe('buildGameStateSnapshot', () => {

  let state: State;
  let you: Player;
  let opponent: Player;

  beforeEach(() => {
    you = new Player();
    you.id = VIEWER_ID;
    you.name = 'You';

    opponent = new Player();
    opponent.id = OPPONENT_ID;
    opponent.name = 'Opponent';

    state = new State();
    state.turn = 3;
    state.phase = GamePhase.PLAYER_TURN;
    state.players = [ you, opponent ];
    state.activePlayer = 0;
  });

  describe('viewer validation', () => {

    it('throws when the viewer is not part of the game', () => {
      expect(() => buildGameStateSnapshot(state, 999))
        .toThrowError('Player 999 does not exist in this game state.');
    });

    it('throws when there is no opposing player', () => {
      state.players = [ you ];

      expect(() => buildGameStateSnapshot(state, VIEWER_ID))
        .toThrowError('Coach snapshots require an opposing player.');
    });

  });

  describe('hidden information', () => {

    it('reveals the viewer\'s hand but omits the opponent\'s entirely', () => {
      you.hand.cards = [ testPokemon('Pikachu', 60) ];
      opponent.hand.cards = [ testPokemon('Mewtwo ex', 130), testPokemon('Bidoof', 60) ];

      const snapshot = buildGameStateSnapshot(state, VIEWER_ID);

      expect(snapshot.you.hand?.map(card => card.name)).toEqual([ 'Pikachu' ]);
      expect(snapshot.you.handCount).toBe(1);
      expect(snapshot.opponent.handCount).toBe(2);
      // Absent, not merely empty - an empty array would still imply we looked.
      expect(Object.prototype.hasOwnProperty.call(snapshot.opponent, 'hand')).toBe(false);
    });

    it('does not leak opponent hand, deck or prize contents anywhere in the payload', () => {
      opponent.hand.cards = [ testPokemon('Opponent Secret Hand', 60) ];
      opponent.deck.cards = [ testPokemon('Opponent Secret Deck', 60) ];

      const secretPrize = new CardList();
      secretPrize.cards = [ testPokemon('Opponent Secret Prize', 60) ];
      opponent.prizes = [ secretPrize ];

      const serialized = JSON.stringify(buildGameStateSnapshot(state, VIEWER_ID));

      // Catches leaks through fields no assertion above thought to check.
      expect(serialized).not.toContain('Opponent Secret Hand');
      expect(serialized).not.toContain('Opponent Secret Deck');
      expect(serialized).not.toContain('Opponent Secret Prize');
    });

  });

  describe('active player identification', () => {

    // Regression: state.activePlayer is an index into state.players, not a
    // player id. Reporting it directly, or comparing it to a player id, names
    // the wrong player - a coach that thinks it is your turn when it is not.
    it('resolves activePlayerId through the players array, not as a raw index', () => {
      state.activePlayer = 1;

      const snapshot = buildGameStateSnapshot(state, VIEWER_ID);

      expect(snapshot.activePlayerId).toBe(OPPONENT_ID);
      expect(snapshot.activePlayerId).not.toBe(1);
    });

    it('reports isViewerTurn true only when the viewer actually holds the turn', () => {
      state.activePlayer = 0;
      expect(buildGameStateSnapshot(state, VIEWER_ID).isViewerTurn).toBe(true);

      state.activePlayer = 1;
      expect(buildGameStateSnapshot(state, VIEWER_ID).isViewerTurn).toBe(false);
    });

  });

  describe('bench positions', () => {

    // Regression: RetreatAction(benchIndex) and CardTarget.index address bench
    // slots positionally. Dropping empty slots would shift every later index
    // and let a recommendation target the wrong Pokemon.
    it('preserves bench indices, using null for empty slots', () => {
      you.bench = [ new PokemonSlot(), slotWith(testPokemon('Spidops', 120)), new PokemonSlot() ];

      const snapshot = buildGameStateSnapshot(state, VIEWER_ID);

      expect(snapshot.you.bench.length).toBe(3);
      expect(snapshot.you.bench[0]).toBeNull();
      expect(snapshot.you.bench[1]?.pokemon.name).toBe('Spidops');
      expect(snapshot.you.bench[2]).toBeNull();
    });

    it('reports a null active slot when there is no active Pokémon', () => {
      const snapshot = buildGameStateSnapshot(state, VIEWER_ID);

      expect(snapshot.you.active).toBeNull();
    });

  });

  describe('board detail', () => {

    it('summarizes the active Pokémon, energy, tools and special conditions', () => {
      you.active.pokemons.cards = [ testPokemon('Mewtwo ex', 130) ];
      you.active.damage = 40;
      you.active.energies.cards = [ testEnergy('Psychic Energy') ];
      you.active.trainers.cards = [ testTool('Choice Belt') ];
      you.active.addSpecialCondition(SpecialCondition.POISONED);

      const snapshot = buildGameStateSnapshot(state, VIEWER_ID);

      expect(snapshot.you.active).toEqual({
        pokemon: { name: 'Mewtwo ex', fullName: 'Mewtwo ex TST', set: 'TST' },
        evolutionStack: [ { name: 'Mewtwo ex', fullName: 'Mewtwo ex TST', set: 'TST' } ],
        hp: 130,
        damage: 40,
        remainingHp: 90,
        energies: [ { name: 'Psychic Energy', fullName: 'Psychic Energy TST', set: 'TST' } ],
        tools: [ { name: 'Choice Belt', fullName: 'Choice Belt TST', set: 'TST' } ],
        specialConditions: [ 'POISONED' ]
      });
    });

    it('exposes the full evolution stack and never reports negative remaining HP', () => {
      you.active.pokemons.cards = [
        testPokemon('Dreepy', 60),
        testPokemon('Drakloak', 90),
        testPokemon('Dragapult ex', 130)
      ];
      you.active.damage = 200;

      const snapshot = buildGameStateSnapshot(state, VIEWER_ID);

      expect(snapshot.you.active?.pokemon.name).toBe('Dragapult ex');
      expect(snapshot.you.active?.evolutionStack.map(card => card.name))
        .toEqual([ 'Dreepy', 'Drakloak', 'Dragapult ex' ]);
      expect(snapshot.you.active?.remainingHp).toBe(0);
    });

    it('reports the opponent\'s public zones: deck size, discard, prizes and board', () => {
      opponent.deck.cards = [ testPokemon('Card 1', 60), testPokemon('Card 2', 60) ];
      opponent.discard.cards = [ testPokemon('Fainted Mon', 60) ];

      const prize = new CardList();
      prize.cards = [ testPokemon('Prize', 60) ];
      opponent.prizes = [ prize ];

      opponent.active.pokemons.cards = [ testPokemon('Dragapult ex', 130) ];

      const snapshot = buildGameStateSnapshot(state, VIEWER_ID);

      expect(snapshot.opponent.deckCount).toBe(2);
      expect(snapshot.opponent.discard.map(card => card.name)).toEqual([ 'Fainted Mon' ]);
      expect(snapshot.opponent.prizesLeft).toBe(1);
      expect(snapshot.opponent.active?.pokemon.name).toBe('Dragapult ex');
    });

  });

  describe('turn context', () => {

    it('reports turn, phase and viewer identity', () => {
      const snapshot = buildGameStateSnapshot(state, VIEWER_ID);

      expect(snapshot.turn).toBe(3);
      expect(snapshot.phase).toBe('PLAYER_TURN');
      expect(snapshot.viewerPlayerId).toBe(VIEWER_ID);
    });

    it('reports which once-per-turn plays the viewer has already used', () => {
      you.energyPlayedTurn = state.turn;
      you.retreatedTurn = state.turn - 1;
      you.stadiumPlayedTurn = state.turn;
      you.stadiumUsedTurn = 0;

      const snapshot = buildGameStateSnapshot(state, VIEWER_ID);

      expect(snapshot.turnFlags).toEqual({
        energyAlreadyPlayed: true,
        alreadyRetreated: false,
        stadiumAlreadyPlayed: true,
        stadiumAlreadyUsed: false
      });
    });

    it('surfaces the viewer\'s pending prompt as a readable question with its choices', () => {
      const cards = new CardList();
      cards.cards = [ testPokemon('Tarountula', 60), testPokemon('Spidops', 120) ];
      const prompt = new ChooseCardsPrompt(VIEWER_ID, GameMessage.CHOOSE_CARD_TO_HAND, cards,
        { superType: SuperType.POKEMON }, { min: 1, max: 1, allowCancel: false });
      prompt.id = 12;
      state.prompts = [ prompt ];

      const snapshot = buildGameStateSnapshot(state, VIEWER_ID);

      expect(snapshot.pendingPrompt).toEqual({
        id: 12,
        type: 'Choose cards',
        question: 'Choose card to hand (choose 1)',
        min: 1,
        max: 1,
        allowCancel: false,
        choices: [ 'Tarountula', 'Spidops' ]
      });
    });

    it('omits blocked cards from the offered choices', () => {
      const cards = new CardList();
      cards.cards = [ testPokemon('Tarountula', 60), testPokemon('Spidops', 120) ];
      const prompt = new ChooseCardsPrompt(VIEWER_ID, GameMessage.CHOOSE_CARD_TO_HAND, cards,
        { superType: SuperType.POKEMON }, { blocked: [ 0 ] });
      state.prompts = [ prompt ];

      const snapshot = buildGameStateSnapshot(state, VIEWER_ID);

      expect(snapshot.pendingPrompt?.choices).toEqual([ 'Spidops' ]);
    });

    it('never surfaces a prompt addressed to the opponent', () => {
      const cards = new CardList();
      cards.cards = [ testPokemon('Opponent Secret Choice', 60) ];
      const opponentPrompt = new ChooseCardsPrompt(OPPONENT_ID, GameMessage.CHOOSE_CARD_TO_HAND,
        cards, { superType: SuperType.POKEMON });
      state.prompts = [ opponentPrompt ];

      const snapshot = buildGameStateSnapshot(state, VIEWER_ID);

      expect(snapshot.pendingPrompt).toBeNull();
      expect(JSON.stringify(snapshot)).not.toContain('Opponent Secret Choice');
    });

    it('reports no pending prompt once the viewer\'s prompt is resolved', () => {
      const prompt = new ConfirmPrompt(VIEWER_ID, GameMessage.WANT_TO_USE_ABILITY);
      prompt.result = true;
      state.prompts = [ prompt ];

      expect(buildGameStateSnapshot(state, VIEWER_ID).pendingPrompt).toBeNull();
    });

    it('counts only unresolved prompts as pending', () => {
      state.prompts = [
        { result: undefined },
        { result: 'already answered' },
        { result: undefined }
      ] as any;

      const snapshot = buildGameStateSnapshot(state, VIEWER_ID);

      expect(snapshot.pendingPromptCount).toBe(2);
    });

  });

});
