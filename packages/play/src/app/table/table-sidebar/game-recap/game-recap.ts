import { GameLog, GamePhase, GameWinner, Player, State, StateLog } from '@ptcg/common';

/**
 * Learn mode, tutorial piece 4: an after-game recap for the player.
 *
 * Built only from the finished game: the final state (winner, Prize cards left) and
 * the game log (how the game ended, which Pokémon were Knocked Out and how many Prize
 * cards each gave up). Each lesson restates a rule from the "How to play" page and
 * links to its section; the recap never guesses at what the player "should" have
 * played.
 */
export interface RecapLine {
  /** Stable id, used to track lines in the template and in specs. */
  id: string;
  text: string;
  /** Section id on the rules page, see RULES_SECTIONS. Optional. */
  section?: string;
}

export interface GameRecap {
  /** 'won', 'lost', 'draw' or 'ended' (finished without a winner). */
  result: 'won' | 'lost' | 'draw' | 'ended';
  headline: string;
  /** What happened: how it ended, the Prize race, the Knock Outs. */
  facts: RecapLine[];
  /** At most MAX_RECAP_LESSONS rule reminders tied to what happened. */
  lessons: RecapLine[];
}

export const MAX_RECAP_LESSONS = 2;

interface KnockOut {
  name: string;
  owner: string;
  prizes: number;
}

/** How a player's game ended, read from the log lines just before the result. */
type EndReason = 'prizes' | 'no-active' | 'deck-out' | 'left' | 'time';

const END_LOGS: { [message: string]: EndReason } = {
  [GameLog.LOG_PLAYER_NO_PRIZE_CARD]: 'prizes',
  [GameLog.LOG_PLAYER_NO_ACTIVE_POKEMON]: 'no-active',
  [GameLog.LOG_PLAYER_NO_CARDS_IN_DECK]: 'deck-out',
  [GameLog.LOG_PLAYER_LEFT_THE_GAME]: 'left',
  [GameLog.LOG_TIME_ELAPSED]: 'time'
};

const FINISH_LOGS: string[] = [
  GameLog.LOG_GAME_FINISHED,
  GameLog.LOG_GAME_FINISHED_DRAW,
  GameLog.LOG_GAME_FINISHED_WINNER,
  GameLog.LOG_GAME_FINISHED_BEFORE_STARTED
];

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

function prizesTaken(player: Player): number {
  return player.prizes.filter(prize => prize.cards.length === 0).length;
}

/** The end reasons logged for each player name, from the last turn of the game. */
function endReasons(logs: StateLog[]): { name: string, reason: EndReason }[] {
  let end = -1;
  for (let i = logs.length - 1; i >= 0; i--) {
    if (FINISH_LOGS.includes(logs[i].message)) {
      end = i;
      break;
    }
  }
  if (end === -1) {
    return [];
  }
  const reasons: { name: string, reason: EndReason }[] = [];
  for (let i = end - 1; i >= 0 && logs[i].message !== GameLog.LOG_TURN; i--) {
    const reason = END_LOGS[logs[i].message];
    if (reason !== undefined) {
      reasons.unshift({ name: String(logs[i].params.name), reason });
    }
  }
  return reasons;
}

/** Knock Outs from the log. Logs written before the owner was recorded are skipped. */
function knockOuts(logs: StateLog[]): KnockOut[] {
  return logs
    .filter(log => log.message === GameLog.LOG_POKEMON_KO && log.params.player !== undefined)
    .map(log => ({
      name: String(log.params.name),
      owner: String(log.params.player),
      prizes: Number(log.params.prizes) || 1
    }));
}

function lastTurn(logs: StateLog[]): number {
  for (let i = logs.length - 1; i >= 0; i--) {
    if (logs[i].message === GameLog.LOG_TURN) {
      return Number(logs[i].params.turn) || 0;
    }
  }
  return 0;
}

function endText(reason: EndReason, who: string, isMe: boolean): string {
  const your = isMe ? 'your' : 'their';
  switch (reason) {
    case 'prizes':
      return `${who} took ${isMe ? 'your' : 'their'} last Prize card.`;
    case 'no-active':
      return `${who} had no Pokémon left in play: ${your} Active Pokémon was Knocked Out `
        + `with nothing on ${your} Bench to replace it.`;
    case 'deck-out':
      return `${who} had no card to draw at the start of ${your} turn.`;
    case 'left':
      return `${who} left the game.`;
    case 'time':
      return `${who} ran out of time.`;
  }
}

function koList(kos: KnockOut[]): string {
  return kos
    .map(ko => ko.prizes > 1 ? `${ko.name} (${ko.prizes} Prizes)` : ko.name)
    .join(', ');
}

/**
 * The recap for the player with the given client id, or undefined while the game is
 * still going, for spectators, and for games that ended before they started.
 * `logs` is the whole game log the client has collected (LocalGameState.logs).
 */
export function getGameRecap(state: State | undefined, logs: StateLog[], clientId: number): GameRecap | undefined {
  if (state === undefined || state.phase !== GamePhase.FINISHED) {
    return undefined;
  }
  const meIndex = state.players.findIndex(p => p.id === clientId);
  if (meIndex === -1 || state.players.length !== 2) {
    return undefined;
  }
  if (logs.some(log => log.message === GameLog.LOG_GAME_FINISHED_BEFORE_STARTED)) {
    return undefined;
  }
  const me = state.players[meIndex];
  const opponent = state.players[meIndex === 0 ? 1 : 0];
  const opponentName = opponent.name || 'Your opponent';

  let result: GameRecap['result'];
  let headline: string;
  if (state.winner === GameWinner.DRAW) {
    result = 'draw';
    headline = 'The game ended in a draw.';
  } else if (state.winner === GameWinner.PLAYER_1 || state.winner === GameWinner.PLAYER_2) {
    result = state.winner === meIndex ? 'won' : 'lost';
    headline = result === 'won' ? 'You won!' : `${opponentName} won this one.`;
  } else {
    result = 'ended';
    headline = 'The game ended without a winner.';
  }

  const turns = lastTurn(logs);
  if (turns > 0) {
    headline += ` It lasted ${plural(turns, 'turn')}.`;
  }

  const facts: RecapLine[] = [];
  const reasons = endReasons(logs);
  reasons.forEach((r, index) => {
    const isMe = r.name === me.name;
    facts.push({
      id: `end-${index}`,
      text: endText(r.reason, isMe ? 'You' : (r.name || opponentName), isMe),
      section: r.reason === 'left' || r.reason === 'time' ? undefined : 'goal'
    });
  });

  facts.push({
    id: 'prizes',
    text: `Prize cards taken: you ${prizesTaken(me)} of ${me.prizes.length}, `
      + `${opponentName} ${prizesTaken(opponent)} of ${opponent.prizes.length}.`
  });

  const kos = knockOuts(logs);
  const myKos = kos.filter(ko => ko.owner === me.name);
  const theirKos = kos.filter(ko => ko.owner === opponent.name);
  // Owner names identify the side; with two players of the same name the split is unknown.
  const sidesKnown = me.name !== opponent.name;
  if (sidesKnown && theirKos.length > 0) {
    facts.push({ id: 'ko-theirs', text: `You Knocked Out: ${koList(theirKos)}.` });
  }
  if (sidesKnown && myKos.length > 0) {
    facts.push({ id: 'ko-mine', text: `${opponentName} Knocked Out: ${koList(myKos)}.` });
  }

  const lessons: RecapLine[] = [];
  const myReasons = reasons.filter(r => r.name === me.name).map(r => r.reason);

  if (result !== 'won' && myReasons.includes('no-active')) {
    lessons.push({
      id: 'lesson-bench',
      text: 'Keep at least one Pokémon on your Bench. If your Active Pokémon is Knocked Out and you have '
        + 'nothing to replace it with, you lose straight away, however many Prize cards are left.',
      section: 'tips'
    });
  }
  if (result !== 'won' && myReasons.includes('deck-out')) {
    lessons.push({
      id: 'lesson-deck',
      text: 'Watch your deck size. Draw and search cards use up your deck, and if you can\'t draw at the start '
        + 'of your turn you lose.',
      section: 'tips'
    });
  }

  const bigLoss = sidesKnown
    ? myKos.filter(ko => ko.prizes > 1).sort((a, b) => b.prizes - a.prizes)[0]
    : undefined;
  if (bigLoss !== undefined) {
    lessons.push({
      id: 'lesson-multi-prize',
      text: `When your ${bigLoss.name} was Knocked Out, ${opponentName} took ${plural(bigLoss.prizes, 'Prize card')}. `
        + 'Pokémon ex give up 2 Prize cards and Mega Evolution Pokémon ex give up 3, so protect them, '
        + 'or attack first with Pokémon that give up only 1.',
      section: 'goal'
    });
  }

  if (result === 'won' && lessons.length === 0) {
    lessons.push({
      id: 'lesson-won',
      text: 'Well played. Next game, try reading the bot\'s "Why?" notes in the log to see how it plans its turns.',
      section: 'tips'
    });
  } else if (lessons.length === 0 && result === 'lost') {
    lessons.push({
      id: 'lesson-prize-race',
      text: 'Each Knock Out takes a Prize card. Attach Energy every turn and power up a backup on your Bench, '
        + 'so you can attack right away when your Active Pokémon goes down.',
      section: 'tips'
    });
  }

  return { result, headline, facts, lessons: lessons.slice(0, MAX_RECAP_LESSONS) };
}
