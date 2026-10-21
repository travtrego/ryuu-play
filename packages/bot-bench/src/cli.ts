import { writeFileSync } from 'fs';
import { BenchmarkSummary, runBenchmark } from './benchmark';
import { benchDecks, findDeck } from './decks';
import { botVariants, findBotVariant } from './bot-variants';
import { formatSummary } from './report';
import { GameLimits } from './headless-game';

const usage = `Usage: node dist/cli.js [options]

  --games N                 games to play (default 100)
  --seed S                  run seed; game i uses a seed derived from (S, i) (default 1)
  --bot-a NAME, --bot-b NAME  bot variants (default "default"); known: ${botVariants.map(v => v.name).join(', ')}
  --decks a,b,...           deck pool (default: all); known: ${benchDecks.map(d => d.name).join(', ')}
  --only i,j,...            replay only these game indexes of the run
  --max-turns N             loop guard (default 200)
  --max-actions N           loop guard (default 5000)
  --max-actions-per-turn N  loop guard (default 250)
  --json [FILE]             write summary + per-game results as JSON (stdout if no FILE)
  --progress                print one line per game to stderr
  --max-errors N            exit 1 if more than N games end with an unexpected error
  --max-guard-aborts N      exit 1 if more than N games are stopped by the loop guard
  --max-stalled N           exit 1 if more than N games stall (nobody can act)
  --max-illegal-moves N     exit 1 if more than N games are aborted for illegal moves
`;

interface CliOptions {
  games: number;
  seed: number;
  botA: string;
  botB: string;
  decks?: string[];
  only?: number[];
  limits: Partial<GameLimits>;
  json?: string | true;
  progress: boolean;
  thresholds: { errors?: number; guard?: number; stalled?: number; illegal?: number };
}

function int(name: string, value: string | undefined): number {
  const n = Number(value);
  if (value === undefined || !Number.isInteger(n) || n < 0) {
    throw new Error(`${name} expects a non-negative integer, got "${value}"`);
  }
  return n;
}

export function parseArgs(argv: string[]): CliOptions {
  const o: CliOptions = { games: 100, seed: 1, botA: 'default', botB: 'default', limits: {},
    progress: false, thresholds: {} };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i];
    switch (arg) {
      case '--games': o.games = int(arg, next()); break;
      case '--seed': o.seed = int(arg, next()); break;
      case '--bot-a': o.botA = next(); break;
      case '--bot-b': o.botB = next(); break;
      case '--decks': o.decks = next().split(',').filter(s => s); break;
      case '--only': o.only = next().split(',').map(s => int(arg, s)); break;
      case '--max-turns': o.limits.maxTurns = int(arg, next()); break;
      case '--max-actions': o.limits.maxActions = int(arg, next()); break;
      case '--max-actions-per-turn': o.limits.maxActionsPerTurn = int(arg, next()); break;
      case '--json':
        if (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) {
          o.json = next();
        } else {
          o.json = true;
        }
        break;
      case '--progress': o.progress = true; break;
      case '--max-errors': o.thresholds.errors = int(arg, next()); break;
      case '--max-guard-aborts': o.thresholds.guard = int(arg, next()); break;
      case '--max-stalled': o.thresholds.stalled = int(arg, next()); break;
      case '--max-illegal-moves': o.thresholds.illegal = int(arg, next()); break;
      case '--help': case '-h':
        process.stdout.write(usage);
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown option "${arg}"`);
    }
  }
  return o;
}

export function checkThresholds(s: BenchmarkSummary, t: CliOptions['thresholds']): string[] {
  const failures: string[] = [];
  const check = (label: string, value: number, max: number | undefined) => {
    if (max !== undefined && value > max) {
      failures.push(`${label}: ${value} > allowed ${max}`);
    }
  };
  check('games with unexpected errors', s.outcomes.error, t.errors);
  check('games stopped by loop guard', s.outcomes.guard, t.guard);
  check('stalled games', s.outcomes.stalled, t.stalled);
  check('games aborted for illegal moves', s.outcomes['illegal-moves'], t.illegal);
  return failures;
}

function main(): number {
  let options: CliOptions;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${(error as Error).message}\n\n${usage}`);
    return 2;
  }

  const decks = options.decks ? options.decks.map(findDeck) : benchDecks;
  const { summary, games } = runBenchmark({
    games: options.games,
    seed: options.seed,
    sideA: findBotVariant(options.botA),
    sideB: findBotVariant(options.botB),
    decks,
    limits: options.limits,
    only: options.only,
    onGame: options.progress
      ? g => process.stderr.write(`game ${g.index} seed ${g.seed} ${g.deckA} vs ${g.deckB}: `
        + `${g.outcome}${g.winnerSide ? ' ' + g.winnerSide : ''} turns=${g.turns} actions=${g.actions} ${g.durationMs}ms\n`)
      : undefined
  });

  if (options.json !== undefined) {
    const json = JSON.stringify({ summary, games }, null, 2);
    if (options.json === true) {
      process.stdout.write(json + '\n');
    } else {
      writeFileSync(options.json, json + '\n');
    }
  }
  if (options.json !== true) {
    process.stdout.write(formatSummary(summary) + '\n');
  }

  const failures = checkThresholds(summary, options.thresholds);
  if (failures.length > 0) {
    process.stderr.write('\nBenchmark thresholds exceeded:\n' + failures.map(f => '  ' + f).join('\n') + '\n');
    return 1;
  }
  return 0;
}

if (require.main === module) {
  process.exitCode = main();
}
