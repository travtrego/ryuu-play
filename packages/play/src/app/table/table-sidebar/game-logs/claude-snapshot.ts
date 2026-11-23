import { CardList, CardType, GamePhase, GameWinner, Player, PokemonSlot, SpecialCondition,
  State } from '@ptcg/common';

/**
 * Learn mode: "Copy game for Claude". Turns the table into plain text the player can
 * paste into a chat with Claude (or any assistant) to ask about the game.
 *
 * Only what the player can see on the board goes in: their own hand, both boards,
 * discard piles, Stadium, counts for decks, hands and Prize cards, and the recent
 * log lines (with the bot's "Why?" notes). The opponent's hand, either deck and
 * face-down Prize cards are never listed by name, even when the client happens to
 * hold their names.
 */

const TYPE_NAMES: { [type: number]: string } = {
  [CardType.COLORLESS]: 'Colorless',
  [CardType.GRASS]: 'Grass',
  [CardType.FIGHTING]: 'Fighting',
  [CardType.PSYCHIC]: 'Psychic',
  [CardType.WATER]: 'Water',
  [CardType.LIGHTNING]: 'Lightning',
  [CardType.METAL]: 'Metal',
  [CardType.DARK]: 'Darkness',
  [CardType.FIRE]: 'Fire',
  [CardType.DRAGON]: 'Dragon',
  [CardType.FAIRY]: 'Fairy'
};

const CONDITION_NAMES: { [condition: number]: string } = {
  [SpecialCondition.PARALYZED]: 'Paralyzed',
  [SpecialCondition.CONFUSED]: 'Confused',
  [SpecialCondition.ASLEEP]: 'Asleep',
  [SpecialCondition.POISONED]: 'Poisoned',
  [SpecialCondition.BURNED]: 'Burned'
};

/** How many log lines go in, newest last. */
export const SNAPSHOT_LOG_LINES = 40;

/** "2x Rare Candy, Iono" — card names grouped, in first-seen order. */
export function groupCardNames(names: string[]): string {
  const counts = new Map<string, number>();
  names.forEach(name => counts.set(name, (counts.get(name) || 0) + 1));
  const parts: string[] = [];
  counts.forEach((count, name) => parts.push(count > 1 ? `${count}x ${name}` : name));
  return parts.length > 0 ? parts.join(', ') : 'none';
}

function cardNames(list: CardList): string[] {
  return list.cards.map(card => card.fullName || card.name);
}

function describeSlot(slot: PokemonSlot): string | undefined {
  const card = slot.getPokemonCard();
  if (card === undefined) {
    return undefined;
  }
  const parts: string[] = [];
  const types = card.cardTypes.map(t => TYPE_NAMES[t]).filter(t => t !== undefined);
  const hpLeft = Math.max(0, card.hp - slot.damage);
  parts.push(`${card.fullName || card.name}${types.length ? ' (' + types.join('/') + ')' : ''}`);
  parts.push(`HP ${hpLeft}/${card.hp}`);
  const below = slot.getPokemons().slice(0, -1).map(c => c.name);
  if (below.length > 0) {
    parts.push(`evolved from ${below.join(' > ')}`);
  }
  parts.push(`Energy: ${groupCardNames(cardNames(slot.energies))}`);
  const tools = slot.getTools().map(t => t.name);
  if (tools.length > 0) {
    parts.push(`Tool: ${tools.join(', ')}`);
  }
  const conditions = slot.specialConditions.map(c => CONDITION_NAMES[c]).filter(c => c !== undefined);
  if (conditions.length > 0) {
    parts.push(conditions.join(', '));
  }
  return parts.join('; ');
}

function describePlayer(player: Player, label: string, showHand: boolean): string[] {
  const lines: string[] = [];
  const prizesLeft = player.prizes.filter(p => p.cards.length > 0).length;
  lines.push(`${label}: ${player.name}`);
  lines.push(`- Prize cards left: ${prizesLeft}; deck: ${player.deck.cards.length} cards;`
    + ` hand: ${player.hand.cards.length} cards`);
  if (showHand && !player.hand.isSecret) {
    lines.push(`- Hand: ${groupCardNames(cardNames(player.hand))}`);
  } else if (player.hand.isPublic && !player.hand.isSecret) {
    lines.push(`- Hand (revealed): ${groupCardNames(cardNames(player.hand))}`);
  }
  lines.push(`- Active: ${describeSlot(player.active) || 'none'}`);
  const bench = player.bench.map(slot => describeSlot(slot)).filter(s => s !== undefined) as string[];
  if (bench.length === 0) {
    lines.push('- Bench: empty');
  } else {
    lines.push('- Bench:');
    bench.forEach(s => lines.push(`  - ${s}`));
  }
  lines.push(`- Discard pile: ${groupCardNames(cardNames(player.discard))}`);
  return lines;
}

function describeResult(state: State, me: Player | undefined): string | undefined {
  if (state.phase !== GamePhase.FINISHED) {
    return undefined;
  }
  if (state.winner === GameWinner.DRAW) {
    return 'The game is over: a draw.';
  }
  const winner = state.winner === GameWinner.PLAYER_1 ? state.players[0]
    : state.winner === GameWinner.PLAYER_2 ? state.players[1] : undefined;
  if (winner === undefined) {
    return 'The game is over.';
  }
  return `The game is over: ${winner.name}${winner === me ? ' (me)' : ''} won.`;
}

/**
 * The text copied to the clipboard. `logLines` are the already translated log
 * lines, oldest first; only the last SNAPSHOT_LOG_LINES are used.
 */
export function buildClaudeSnapshot(state: State, clientId: number, logLines: string[]): string {
  const me = state.players.find(p => p.id === clientId);
  const opponent = me !== undefined
    ? state.players.find(p => p !== me)
    : undefined;

  const lines: string[] = [];
  lines.push('I\'m learning the Pokémon Trading Card Game by playing against a bot in RyuuPlay.'
    + ' Here is my current game. Please explain what is going on and what I could do better,'
    + ' and answer my question below.');
  lines.push('');
  const format = state.rules && state.rules.formatName ? state.rules.formatName : 'unknown';
  lines.push(`Format: ${format}. Turn ${state.turn}.`);
  const turnPlayer = state.players[state.activePlayer];
  if (state.phase !== GamePhase.FINISHED && turnPlayer !== undefined) {
    lines.push(`It is ${turnPlayer.name}'s turn${turnPlayer === me ? ' (mine)' : ''}.`);
  }
  const result = describeResult(state, me);
  if (result !== undefined) {
    lines.push(result);
  }

  state.players.forEach(player => {
    const mine = me !== undefined && player === me;
    const label = me === undefined ? 'Player'
      : mine ? 'Me' : 'Opponent';
    if (me === undefined || mine || player === opponent) {
      lines.push('');
      describePlayer(player, label, mine).forEach(line => lines.push(line));
    }
  });

  const stadium = state.players
    .map(p => p.stadium.cards[0])
    .find(card => card !== undefined);
  lines.push('');
  lines.push(`Stadium in play: ${stadium ? stadium.name : 'none'}`);

  const recent = logLines.slice(-SNAPSHOT_LOG_LINES);
  if (recent.length > 0) {
    lines.push('');
    lines.push(`Recent game log (last ${recent.length} lines, "Why?" lines are the bot explaining its move):`);
    recent.forEach(line => lines.push(`- ${line}`));
  }

  lines.push('');
  lines.push('My question: ');
  return lines.join('\n');
}
