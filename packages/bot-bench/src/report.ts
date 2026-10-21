import { BenchmarkSummary, WinStats } from './benchmark';

function pct(x: number): string {
  return (x * 100).toFixed(1) + '%';
}

function table(headers: string[], rows: string[][]): string {
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map(r => r[i].length)));
  const line = (cells: string[]) => cells.map((c, i) => i === 0 ? c.padEnd(widths[i]) : c.padStart(widths[i])).join('  ');
  return [line(headers), widths.map(w => '-'.repeat(w)).join('  '), ...rows.map(line)].join('\n');
}

function winRow(name: string, s: WinStats): string[] {
  return [name, String(s.games), String(s.wins), String(s.losses), String(s.other), pct(s.winRate)];
}

const winHeaders = ['', 'games', 'wins', 'losses', 'no result', 'win rate'];

export function formatSummary(s: BenchmarkSummary): string {
  const out: string[] = [];
  out.push(`Bot benchmark: A=${s.sideA} vs B=${s.sideB}, ${s.games} games, seed ${s.seed}, ${(s.durationMs / 1000).toFixed(1)}s`);
  out.push('');
  out.push(table(['outcome', 'games'], Object.entries(s.outcomes).map(([k, v]) => [k, String(v)])));
  out.push('end reasons: ' + (Object.entries(s.endReasons).map(([k, v]) => `${k}=${v}`).join(', ') || '-'));
  if (Object.keys(s.guardReasons).length > 0) {
    out.push('guard reasons: ' + Object.entries(s.guardReasons).map(([k, v]) => `${k}=${v}`).join(', '));
  }
  out.push('');
  out.push(table(winHeaders.map((h, i) => i === 0 ? 'side' : h), [
    winRow(`A (${s.sideA})`, s.side.A),
    winRow(`B (${s.sideB})`, s.side.B),
    winRow('went first', s.firstPlayer)
  ]));
  out.push('');
  out.push(table(winHeaders.map((h, i) => i === 0 ? 'deck' : h),
    Object.keys(s.decks).sort().map(d => winRow(d, s.decks[d]))));
  out.push('');
  out.push(table(['', 'avg', 'min', 'max'], [
    ['turns', s.turns.avg.toFixed(1), String(s.turns.min), String(s.turns.max)],
    ['bot actions', s.actions.avg.toFixed(1), String(s.actions.min), String(s.actions.max)]
  ]));
  out.push('');
  out.push(`rejected bot actions (GameError): ${s.invalidMoves}`);
  const messages = Object.entries(s.invalidMoveMessages).sort((a, b) => b[1] - a[1]);
  for (const [message, count] of messages.slice(0, 10)) {
    out.push(`  ${String(count).padStart(6)}  ${message}`);
  }
  out.push(`unexpected errors: ${s.errors.length}`);
  for (const e of s.errors) {
    out.push(`  game ${e.index} (seed ${e.seed}, ${e.deckA} vs ${e.deckB}) ${e.source} turn ${e.turn} ${e.phase}`
      + `${e.action ? ' ' + e.action : ''}${e.side ? ' side ' + e.side : ''}: ${e.message}`);
  }
  if (s.problemGames.length > 0) {
    out.push('games without a win/draw result:');
    for (const p of s.problemGames) {
      out.push(`  game ${p.index} (seed ${p.seed}, ${p.deckA} vs ${p.deckB}): ${p.outcome}`
        + `${p.detail ? ' (' + p.detail + ')' : ''}, turn ${p.turns}, ${p.actions} actions`);
    }
  }
  return out.join('\n');
}
