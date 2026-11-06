import { AddPlayerAction } from '../actions/add-player-action';
import { AlertPrompt } from '../prompts/alert-prompt';
import { Card } from '../card/card';
import { ChooseCardsPrompt } from '../prompts/choose-cards-prompt';
import { CoinFlipPrompt } from '../prompts/coin-flip-prompt';
import { GameLog, GameMessage } from '../../game-message';
import { GamePhase, GameWinner } from '../state/state';
import { InvitePlayerAction } from '../actions/invite-player-action';
import { InvitePlayerPrompt } from '../prompts/invite-player-prompt';
import { Player } from '../state/player';
import { PokemonCard } from '../card/pokemon-card';
import { Prompt } from '../prompts/prompt';
import { ShowCardsPrompt } from '../prompts/show-cards-prompt';
import { ShuffleDeckPrompt } from '../prompts/shuffle-prompt';
import { Store } from '../store';
import {
  SETUP_FORMAT,
  createStore,
  createTurnState,
  dispatchError,
  errorOf,
  identityOrder,
  makeDeck,
  registerSetupCards,
  resolve,
  setupCards,
  unresolved
} from './reducer-test-utils';

describe('setupPhaseReducer', () => {

  let store: Store;

  function logs(): string[] {
    return store.state.logs.map(l => l.message);
  }

  function promptFor<T extends Prompt<any>>(playerId: number, type: new (...args: any[]) => T): T {
    const prompt = unresolved(store).find(p => p.playerId === playerId && p instanceof type);
    expect(prompt).toBeDefined();
    return prompt as T;
  }

  function shuffle(playerId: number) {
    const prompt = promptFor(playerId, ShuffleDeckPrompt);
    resolve(store, prompt, identityOrder(store, playerId));
  }

  function basics(player: Player, count: number): Card[] {
    return player.hand.cards.filter(c => c instanceof PokemonCard).slice(0, count);
  }

  function chooseStartingPokemons(count1: number, count2: number) {
    const [p1, p2] = store.state.players;
    const choose1 = promptFor(1, ChooseCardsPrompt);
    const choose2 = promptFor(2, ChooseCardsPrompt);
    expect(choose1.message).toBe(GameMessage.CHOOSE_STARTING_POKEMONS);
    resolve(store, choose1, basics(p1, count1));
    resolve(store, choose2, basics(p2, count2));
  }

  beforeAll(() => {
    registerSetupCards();
  });

  beforeEach(() => {
    store = createStore();
  });

  describe('AddPlayerAction', () => {

    it('Should add the first player and wait for the second', () => {
      store.dispatch(new AddPlayerAction(1, 'Alice', makeDeck()));
      const s = store.state;
      expect(s.phase).toBe(GamePhase.WAITING_FOR_PLAYERS);
      expect(s.players.length).toBe(1);
      const player = s.players[0];
      expect(player.id).toBe(1);
      expect(player.name).toBe('Alice');
      expect(player.deck.cards.length).toBe(60);
      expect(player.deck.isSecret).toBe(true);
      expect(player.bench.length).toBe(5);
      expect(player.prizes.length).toBe(6);
      expect(player.prizes.every(p => p.isSecret)).toBe(true);
      expect(player.active.pokemons.isPublic).toBe(true);
      expect(player.discard.isPublic).toBe(true);
      expect(s.cardNames.length).toBe(60);
      expect(player.deck.cards.map(c => c.id)).toEqual(s.cardNames.map((n, i) => i));
      expect(s.prompts.length).toBe(0);
    });

    it('Should ignore the action when game is not waiting for players', () => {
      const state = createTurnState();
      store = createStore(state);
      store.dispatch(new AddPlayerAction(3, 'Carol', makeDeck()));
      expect(store.state.players.length).toBe(2);
    });

    it('Should throw ALREADY_PLAYING when the same client joins twice', () => {
      store.dispatch(new AddPlayerAction(1, 'Alice', makeDeck()));
      expect(dispatchError(store, new AddPlayerAction(1, 'Alice', makeDeck()))).toBe(GameMessage.ALREADY_PLAYING);
      expect(store.state.players.length).toBe(1);
    });

    it('Should throw MAX_PLAYERS_REACHED when two players are seated', () => {
      const state = createTurnState();
      state.phase = GamePhase.WAITING_FOR_PLAYERS;
      store = createStore(state);
      expect(dispatchError(store, new AddPlayerAction(3, 'Carol', makeDeck())))
        .toBe(GameMessage.MAX_PLAYERS_REACHED);
      expect(dispatchError(store, new InvitePlayerAction(3, 'Carol')))
        .toBe(GameMessage.MAX_PLAYERS_REACHED);
    });

    it('Should throw INVALID_DECK for an invalid deck', () => {
      const short = makeDeck().slice(1);
      const unknown = makeDeck().map((n, i) => i === 10 ? 'Unknown Card XYZ' : n);
      const noBasic = makeDeck([]);
      expect(dispatchError(store, new AddPlayerAction(1, 'Alice', short))).toBe(GameMessage.INVALID_DECK);
      expect(dispatchError(store, new AddPlayerAction(1, 'Alice', unknown))).toBe(GameMessage.INVALID_DECK);
      expect(dispatchError(store, new AddPlayerAction(1, 'Alice', noBasic))).toBe(GameMessage.INVALID_DECK);
      expect(store.state.players.length).toBe(0);
    });

    it('Should throw INVALID_DECK when deck does not match the game format', () => {
      store.state.rules.formatName = 'Format That Does Not Exist';
      expect(dispatchError(store, new AddPlayerAction(1, 'Alice', makeDeck()))).toBe(GameMessage.INVALID_DECK);
      expect(store.state.players.length).toBe(0);
    });

    it('Should accept a deck legal in the game format', () => {
      store.state.rules.formatName = SETUP_FORMAT;
      store.dispatch(new AddPlayerAction(1, 'Alice', makeDeck()));
      expect(store.state.players.length).toBe(1);
    });

    it('Should start setup with two players and play the full setup', () => {
      store.dispatch(new AddPlayerAction(1, 'Alice', makeDeck()));
      store.dispatch(new AddPlayerAction(2, 'Bob', makeDeck()));

      expect(store.state.phase).toBe(GamePhase.SETUP);
      expect(store.state.cardNames.length).toBe(120);
      expect(unresolved(store).length).toBe(1);
      expect(dispatchError(store, new AddPlayerAction(3, 'Carol', makeDeck())))
        .toBe(GameMessage.ACTION_IN_PROGRESS);

      shuffle(1);
      expect(store.state.players[0].hand.cards.length).toBe(7);
      shuffle(2);
      expect(store.state.players[1].hand.cards.length).toBe(7);

      chooseStartingPokemons(2, 1);
      const [p1, p2] = store.state.players;
      expect(p1.active.pokemons.cards.length).toBe(1);
      expect(p1.bench[0].pokemons.cards.length).toBe(1);
      expect(p2.bench[0].pokemons.cards.length).toBe(0);
      expect(p1.getPrizeLeft()).toBe(6);
      expect(p2.getPrizeLeft()).toBe(6);

      const coinFlip = promptFor(1, CoinFlipPrompt);
      expect(coinFlip.message).toBe(GameMessage.SETUP_WHO_BEGINS_FLIP);
      resolve(store, coinFlip, false);

      const s = store.state;
      expect(s.phase).toBe(GamePhase.PLAYER_TURN);
      expect(s.activePlayer).toBe(1);
      expect(s.turn).toBe(1);
      // Bob begins and draws a card
      expect(p2.hand.cards.length).toBe(7);
      expect(p2.deck.cards.length).toBe(60 - 7 - 6 - 1);
      expect(p1.hand.cards.length).toBe(5);
      expect(p1.deck.cards.length).toBe(60 - 7 - 6);
      // First player's pokemons count as played on turn 1, second on turn 2
      expect(p2.active.pokemonPlayedTurn).toBe(1);
      expect(p1.active.pokemonPlayedTurn).toBe(2);
      expect(p1.bench[0].pokemonPlayedTurn).toBe(2);
      expect(unresolved(store).length).toBe(0);
    });

    it('Should let the first player begin when coin flip is heads', () => {
      store.dispatch(new AddPlayerAction(1, 'Alice', makeDeck()));
      store.dispatch(new AddPlayerAction(2, 'Bob', makeDeck()));
      shuffle(1);
      shuffle(2);
      chooseStartingPokemons(1, 1);
      resolve(store, promptFor(1, CoinFlipPrompt), true);
      expect(store.state.activePlayer).toBe(0);
      expect(store.state.players[0].hand.cards.length).toBe(7);
    });

    it('Should skip the coin flip when an effect decides who begins', () => {
      const deck = makeDeck();
      deck[59] = setupCards.secondBegins.fullName;
      store.dispatch(new AddPlayerAction(1, 'Alice', deck));
      store.dispatch(new AddPlayerAction(2, 'Bob', makeDeck()));
      shuffle(1);
      shuffle(2);
      chooseStartingPokemons(1, 1);
      expect(unresolved(store).length).toBe(0);
      expect(store.state.phase).toBe(GamePhase.PLAYER_TURN);
      expect(store.state.activePlayer).toBe(1);
    });

    it('Should redraw when first player has no basic and let opponent draw a card', () => {
      // First 7 cards are energies, basic pokemons are next
      store.dispatch(new AddPlayerAction(1, 'Alice', makeDeck([7, 8, 9, 10])));
      store.dispatch(new AddPlayerAction(2, 'Bob', makeDeck()));
      shuffle(1);
      shuffle(2);

      expect(logs()).toContain(GameLog.LOG_SETUP_NO_BASIC_POKEMON);
      const show = promptFor(2, ShowCardsPrompt);
      expect(show.message).toBe(GameMessage.SETUP_OPPONENT_NO_BASIC);
      expect(show.cards.length).toBe(7);
      const alert = promptFor(1, AlertPrompt);
      expect(alert.message).toBe(GameMessage.SETUP_PLAYER_NO_BASIC);
      resolve(store, show, true);
      resolve(store, alert, true);
      expect(store.state.players[1].hand.cards.length).toBe(8);

      // Only Alice reshuffles
      shuffle(1);
      expect(unresolved(store).some(p => p instanceof ShuffleDeckPrompt)).toBe(false);
      expect(basics(store.state.players[0], 7).length).toBe(4);

      chooseStartingPokemons(1, 1);
      resolve(store, promptFor(1, CoinFlipPrompt), true);
      expect(store.state.phase).toBe(GamePhase.PLAYER_TURN);
    });

    it('Should redraw when second player has no basic, first player may decline extra card', () => {
      store.dispatch(new AddPlayerAction(1, 'Alice', makeDeck()));
      store.dispatch(new AddPlayerAction(2, 'Bob', makeDeck([7, 8, 9, 10])));
      shuffle(1);
      shuffle(2);

      const show = promptFor(1, ShowCardsPrompt);
      const alert = promptFor(2, AlertPrompt);
      resolve(store, show, null);
      resolve(store, alert, true);
      expect(store.state.players[0].hand.cards.length).toBe(7);
      expect(store.state.logs.find(l => l.message === GameLog.LOG_SETUP_NO_BASIC_POKEMON)?.params)
        .toEqual({ name: 'Bob' });

      shuffle(2);
      chooseStartingPokemons(1, 1);
      expect(promptFor(1, CoinFlipPrompt)).toBeDefined();
    });

    it('Should redraw both hands without reveal when nobody has a basic', () => {
      store.dispatch(new AddPlayerAction(1, 'Alice', makeDeck([7, 8, 9, 10])));
      store.dispatch(new AddPlayerAction(2, 'Bob', makeDeck([7, 8, 9, 10])));
      shuffle(1);
      shuffle(2);
      expect(unresolved(store).some(p => p instanceof ShowCardsPrompt)).toBe(false);
      shuffle(1);
      shuffle(2);
      expect(logs()).not.toContain(GameLog.LOG_SETUP_NO_BASIC_POKEMON);
      chooseStartingPokemons(1, 1);
      expect(promptFor(1, CoinFlipPrompt)).toBeDefined();
    });
  });

  describe('InvitePlayerAction', () => {

    beforeEach(() => {
      store.dispatch(new AddPlayerAction(1, 'Alice', makeDeck()));
    });

    it('Should seat the invited player and ask for a deck', () => {
      store.dispatch(new InvitePlayerAction(2, 'Bob'));
      expect(store.state.players.length).toBe(2);
      expect(store.state.players[1].name).toBe('Bob');
      const prompt = promptFor(2, InvitePlayerPrompt);
      expect(prompt.message).toBe(GameMessage.INVITATION_MESSAGE);
      expect(store.state.phase).toBe(GamePhase.WAITING_FOR_PLAYERS);
    });

    it('Should throw ALREADY_PLAYING when inviting the seated player', () => {
      expect(dispatchError(store, new InvitePlayerAction(1, 'Alice'))).toBe(GameMessage.ALREADY_PLAYING);
    });

    it('Should finish the game when invitation is declined', () => {
      store.dispatch(new InvitePlayerAction(2, 'Bob'));
      resolve(store, promptFor(2, InvitePlayerPrompt), null);
      expect(logs()).toContain(GameLog.LOG_INVITATION_NOT_ACCEPTED);
      expect(store.state.phase).toBe(GamePhase.FINISHED);
      expect(store.state.winner).toBe(GameWinner.NONE);
    });

    it('Should reject an invalid deck and keep the invitation open', () => {
      store.dispatch(new InvitePlayerAction(2, 'Bob'));
      const prompt = promptFor(2, InvitePlayerPrompt);
      expect(errorOf(() => resolve(store, prompt, makeDeck().slice(1)))).toBe(GameMessage.INVALID_DECK);
      expect(prompt.result).toBeUndefined();

      resolve(store, prompt, makeDeck());
      expect(store.state.players[1].deck.cards.length).toBe(60);
      expect(store.state.cardNames.length).toBe(120);
      expect(store.state.phase).toBe(GamePhase.SETUP);
      expect(promptFor(1, ShuffleDeckPrompt)).toBeDefined();
    });

    it('Should accept invitation as the first player and wait for an opponent', () => {
      store = createStore();
      store.dispatch(new InvitePlayerAction(1, 'Alice'));
      resolve(store, promptFor(1, InvitePlayerPrompt), makeDeck());
      expect(store.state.phase).toBe(GamePhase.WAITING_FOR_PLAYERS);
      expect(store.state.players[0].deck.cards.length).toBe(60);

      store.dispatch(new AddPlayerAction(2, 'Bob', makeDeck()));
      expect(store.state.phase).toBe(GamePhase.SETUP);
    });
  });

});
