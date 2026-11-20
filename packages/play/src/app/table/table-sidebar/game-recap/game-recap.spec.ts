import { CardList, GameLog, GamePhase, GameWinner, Player, State, StateLog } from '@ptcg/common';

import { getGameRecap, MAX_RECAP_LESSONS } from './game-recap';
import { RULES_SECTIONS } from '../../../rules/rules.component';

describe('getGameRecap (learn mode)', () => {
  const myId = 1;
  const botId = 2;
  let state: State;
  let me: Player;
  let bot: Player;
  let logs: StateLog[];

  function prizes(left: number): CardList[] {
    const lists: CardList[] = [];
    for (let i = 0; i < 6; i++) {
      const list = new CardList();
      if (i < left) {
        list.cards.push({} as any);
      }
      lists.push(list);
    }
    return lists;
  }

  function log(message: GameLog, params: { [key: string]: string | number } = {}): void {
    const entry = new StateLog(message, params);
    entry.id = logs.length + 1;
    logs.push(entry);
  }

  function ko(name: string, owner: string, prizeCount = 1): void {
    log(GameLog.LOG_POKEMON_KO, { name, player: owner, prizes: prizeCount });
  }

  function finish(winner: GameWinner): void {
    state.winner = winner;
    state.phase = GamePhase.FINISHED;
    if (winner === GameWinner.DRAW) {
      log(GameLog.LOG_GAME_FINISHED_DRAW);
    } else if (winner === GameWinner.NONE) {
      log(GameLog.LOG_GAME_FINISHED);
    } else {
      log(GameLog.LOG_GAME_FINISHED_WINNER, { name: state.players[winner].name });
    }
  }

  function recap() {
    return getGameRecap(state, logs, myId)!;
  }

  function ids(lines: { id: string }[]): string[] {
    return lines.map(line => line.id);
  }

  beforeEach(() => {
    state = new State();
    me = new Player();
    me.id = myId;
    me.name = 'Ash';
    bot = new Player();
    bot.id = botId;
    bot.name = 'Bot';
    state.players = [me, bot];
    me.prizes = prizes(6);
    bot.prizes = prizes(6);
    logs = [];
    log(GameLog.LOG_TURN, { turn: 1 });
  });

  it('is undefined while the game is going, for spectators and for a game that never started', () => {
    state.phase = GamePhase.PLAYER_TURN;
    expect(getGameRecap(state, logs, myId)).toBeUndefined();
    expect(getGameRecap(undefined, logs, myId)).toBeUndefined();
    finish(GameWinner.PLAYER_1);
    expect(getGameRecap(state, logs, 99)).toBeUndefined();
    log(GameLog.LOG_GAME_FINISHED_BEFORE_STARTED);
    expect(getGameRecap(state, logs, myId)).toBeUndefined();
  });

  it('a win on Prize cards: headline, turn count, Prize race and Knock Outs', () => {
    log(GameLog.LOG_TURN, { turn: 9 });
    ko('Riolu', 'Bot');
    ko('Mega Lucario ex', 'Bot', 3);
    ko('Pikachu', 'Ash');
    bot.prizes = prizes(5);
    me.prizes = prizes(0);
    log(GameLog.LOG_PLAYER_NO_PRIZE_CARD, { name: 'Ash' });
    finish(GameWinner.PLAYER_1);

    const r = recap();
    expect(r.result).toEqual('won');
    expect(r.headline).toEqual('You won! It lasted 9 turns.');
    expect(r.facts.map(f => f.text)).toEqual([
      'You took your last Prize card.',
      'Prize cards taken: you 6 of 6, Bot 1 of 6.',
      'You Knocked Out: Riolu, Mega Lucario ex (3 Prizes).',
      'Bot Knocked Out: Pikachu.'
    ]);
    expect(ids(r.lessons)).toEqual(['lesson-won']);
  });

  it('a loss with an empty Bench points to the Bench rule', () => {
    log(GameLog.LOG_TURN, { turn: 4 });
    ko('Pikachu', 'Ash');
    log(GameLog.LOG_PLAYER_NO_ACTIVE_POKEMON, { name: 'Ash' });
    bot.prizes = prizes(5);
    finish(GameWinner.PLAYER_2);

    const r = recap();
    expect(r.result).toEqual('lost');
    expect(r.headline).toEqual('Bot won this one. It lasted 4 turns.');
    expect(r.facts[0].text).toContain('You had no Pokémon left in play');
    expect(r.facts[0].section).toEqual('goal');
    expect(ids(r.lessons)).toEqual(['lesson-bench']);
    expect(r.lessons[0].section).toEqual('tips');
  });

  it('a deck-out loss points to deck size', () => {
    log(GameLog.LOG_TURN, { turn: 20 });
    log(GameLog.LOG_PLAYER_NO_CARDS_IN_DECK, { name: 'Ash' });
    finish(GameWinner.PLAYER_2);
    const r = recap();
    expect(r.facts[0].text).toEqual('You had no card to draw at the start of your turn.');
    expect(ids(r.lessons)).toEqual(['lesson-deck']);
  });

  it('names the Pokémon ex that gave up the most Prize cards', () => {
    ko('Dreepy', 'Ash');
    ko('Dragapult ex', 'Ash', 2);
    ko('Mega Lucario ex', 'Ash', 3);
    me.prizes = prizes(6);
    bot.prizes = prizes(0);
    log(GameLog.LOG_PLAYER_NO_PRIZE_CARD, { name: 'Bot' });
    finish(GameWinner.PLAYER_2);
    const r = recap();
    expect(r.facts[0].text).toEqual('Bot took their last Prize card.');
    expect(ids(r.lessons)).toEqual(['lesson-multi-prize']);
    expect(r.lessons[0].text).toContain('When your Mega Lucario ex was Knocked Out, Bot took 3 Prize cards.');
  });

  it('a plain Prize loss gets the backup-attacker reminder', () => {
    ko('Pikachu', 'Ash');
    log(GameLog.LOG_PLAYER_NO_PRIZE_CARD, { name: 'Bot' });
    finish(GameWinner.PLAYER_2);
    expect(ids(recap().lessons)).toEqual(['lesson-prize-race']);
  });

  it('only reads end reasons from the last turn, and caps the lessons', () => {
    log(GameLog.LOG_PLAYER_NO_CARDS_IN_DECK, { name: 'Ash' });
    log(GameLog.LOG_TURN, { turn: 2 });
    ko('Charizard ex', 'Ash', 2);
    log(GameLog.LOG_PLAYER_NO_ACTIVE_POKEMON, { name: 'Ash' });
    finish(GameWinner.PLAYER_2);
    const r = recap();
    expect(ids(r.facts).filter(id => id.startsWith('end-'))).toEqual(['end-0']);
    expect(ids(r.lessons)).toEqual(['lesson-bench', 'lesson-multi-prize']);
    expect(r.lessons.length).toBeLessThanOrEqual(MAX_RECAP_LESSONS);
  });

  it('a draw, and a game that ended without a winner', () => {
    finish(GameWinner.DRAW);
    expect(recap().result).toEqual('draw');
    expect(recap().headline).toEqual('The game ended in a draw. It lasted 1 turn.');
    logs = [];
    finish(GameWinner.NONE);
    expect(recap().result).toEqual('ended');
    expect(recap().headline).toEqual('The game ended without a winner.');
  });

  it('leaving the game and running out of time have no rules link', () => {
    log(GameLog.LOG_PLAYER_LEFT_THE_GAME, { name: 'Bot' });
    finish(GameWinner.PLAYER_1);
    expect(recap().facts[0]).toEqual({ id: 'end-0', text: 'Bot left the game.', section: undefined });
  });

  it('skips Knock Out logs without an owner (older games) and same-name players', () => {
    log(GameLog.LOG_POKEMON_KO, { name: 'Pikachu' });
    finish(GameWinner.PLAYER_1);
    expect(ids(recap().facts)).toEqual(['prizes']);
    bot.name = 'Ash';
    ko('Pikachu', 'Ash', 2);
    expect(ids(recap().facts)).toEqual(['prizes']);
    expect(ids(recap().lessons)).toEqual(['lesson-won']);
  });

  it('links only to sections that exist on the rules page', () => {
    const sections = RULES_SECTIONS.map(s => s.id);
    ko('Pikachu', 'Ash', 2);
    log(GameLog.LOG_PLAYER_NO_ACTIVE_POKEMON, { name: 'Ash' });
    finish(GameWinner.PLAYER_2);
    const r = recap();
    [...r.facts, ...r.lessons].filter(l => l.section).forEach(l => {
      expect(sections).toContain(l.section!);
    });
  });
});
