#!/usr/bin/env node

/*
 * Audits curated current-meta decklists against the card implementations
 * already present in packages/sets/src.
 *
 * Why this exists:
 * RyuuPlay has a large historical card library, but our product only needs
 * the cards used by current competitive decks. This tool turns that into a
 * measurable queue instead of implementing modern cards at random.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DECK_DIR = path.join(ROOT, 'data', 'meta-decks');
const SETS_DIR = path.join(ROOT, 'packages', 'sets', 'src');

const args = new Set(process.argv.slice(2));
const jsonOutput = args.has('--json');
const failOnMissing = args.has('--fail-on-missing');
const deckArgIndex = process.argv.indexOf('--deck');
const requestedDeck = deckArgIndex >= 0 ? process.argv[deckArgIndex + 1] : null;

const BASIC_ENERGY_NAMES = new Set([
  'grass energy',
  'fire energy',
  'water energy',
  'lightning energy',
  'psychic energy',
  'fighting energy',
  'darkness energy',
  'metal energy',
]);

function canonical(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function walkTypeScriptFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  const output = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      output.push(...walkTypeScriptFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) {
      output.push(fullPath);
    }
  }
  return output;
}

function propertyValues(source, property) {
  // Card metadata is ordinary TypeScript string literals. The older parser
  // stopped at any quote character, so a valid value such as
  // `public name = 'Team Rocket\'s Mewtwo ex'` was silently skipped. Match
  // each quote style independently and allow escaped characters inside it.
  const pattern = new RegExp(
    `public\\s+(?:readonly\\s+)?${property}(?:\\s*:\\s*string)?\\s*=\\s*` +
      `(?:'((?:\\\\.|[^'\\\\])*)'|"((?:\\\\.|[^"\\\\])*)"|\\x60((?:\\\\.|[^\\x60\\\\])*)\\x60)\\s*;`,
    'g'
  );

  return [...source.matchAll(pattern)].map(match => {
    const raw = match[1] ?? match[2] ?? match[3] ?? '';
    return raw.replace(/\\(['"`\\])/g, '$1');
  });
}

function buildImplementationIndex() {
  const index = new Map();
  const files = walkTypeScriptFiles(SETS_DIR);

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const names = propertyValues(source, 'name');
    if (names.length === 0) continue;

    const sets = [...new Set(propertyValues(source, 'set'))];
    const fullNames = [...new Set(propertyValues(source, 'fullName'))];
    const relativeFile = path.relative(ROOT, file).replace(/\\/g, '/');

    for (const name of names) {
      const key = canonical(name);
      const definitions = index.get(key) || [];
      definitions.push({ name, sets, fullNames, file: relativeFile });
      index.set(key, definitions);
    }
  }

  return { index, scannedFiles: files.length };
}

function loadDecks() {
  if (!fs.existsSync(DECK_DIR)) {
    throw new Error(`Deck directory not found: ${DECK_DIR}`);
  }

  const files = fs.readdirSync(DECK_DIR)
    .filter(file => file.endsWith('.json'))
    .sort();

  const ids = new Set();
  const decks = files.map(file => {
    const filePath = path.join(DECK_DIR, file);
    const deck = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!deck.id || !deck.name || !Array.isArray(deck.cards)) {
      throw new Error(`${file} must contain id, name, and cards.`);
    }
    if (ids.has(deck.id)) {
      throw new Error(`Duplicate deck id: ${deck.id}`);
    }
    ids.add(deck.id);

    let total = 0;
    for (const card of deck.cards) {
      if (!Number.isInteger(card.count) || card.count <= 0 || !card.name) {
        throw new Error(`${file} contains an invalid card entry.`);
      }
      total += card.count;
    }

    if (total !== 60) {
      throw new Error(`${deck.name} has ${total} cards; physical Pokémon TCG decks must have 60.`);
    }

    return { ...deck, file };
  });

  if (requestedDeck) {
    const selected = decks.filter(deck => deck.id === requestedDeck);
    if (selected.length === 0) {
      throw new Error(`Unknown deck id: ${requestedDeck}`);
    }
    return selected;
  }

  return decks;
}

function classifyCard(card, implementationIndex) {
  const candidates = implementationIndex.get(canonical(card.name)) || [];

  if (candidates.length === 0) {
    return { status: 'missing', candidates: [] };
  }

  // Basic Energy is mechanically equivalent regardless of printing/set.
  if (card.basic === true && BASIC_ENERGY_NAMES.has(canonical(card.name))) {
    return { status: 'implemented', candidates };
  }

  const desiredSet = canonical(card.set);
  const exact = desiredSet && candidates.some(candidate =>
    candidate.sets.some(set => canonical(set) === desiredSet)
  );

  if (exact) {
    return { status: 'implemented', candidates };
  }

  // A same-name implementation can be a reprint (good) or a different card
  // with different text (dangerous). Keep it separate until verified.
  return { status: 'verify-printing', candidates };
}

function auditDecks(decks, implementationIndex) {
  const missingUsage = new Map();
  const verifyUsage = new Map();
  const results = [];

  for (const deck of decks) {
    const cards = deck.cards.map(card => {
      const classification = classifyCard(card, implementationIndex);
      const result = {
        ...card,
        status: classification.status,
        implementations: classification.candidates,
      };

      if (classification.status !== 'implemented') {
        const usageMap = classification.status === 'missing' ? missingUsage : verifyUsage;
        const usageKey = [canonical(card.name), canonical(card.set), String(card.number || '')].join('|');
        const usage = usageMap.get(usageKey) || {
          name: card.name,
          set: card.set || null,
          number: card.number || null,
          copies: 0,
          decks: new Set(),
        };
        usage.copies += card.count;
        usage.decks.add(deck.id);
        usageMap.set(usageKey, usage);
      }

      return result;
    });

    const uniqueImplemented = cards.filter(card => card.status === 'implemented').length;
    const uniqueVerify = cards.filter(card => card.status === 'verify-printing').length;
    const uniqueMissing = cards.filter(card => card.status === 'missing').length;

    results.push({
      id: deck.id,
      name: deck.name,
      asOf: deck.asOf || null,
      source: deck.source || null,
      uniqueCards: cards.length,
      uniqueImplemented,
      uniqueVerify,
      uniqueMissing,
      cards,
    });
  }

  function usageList(map) {
    return [...map.values()]
      .map(item => ({ ...item, decks: [...item.decks].sort(), deckCount: item.decks.size }))
      .sort((a, b) =>
        b.deckCount - a.deckCount ||
        b.copies - a.copies ||
        a.name.localeCompare(b.name)
      );
  }

  return {
    decks: results,
    missingPriority: usageList(missingUsage),
    verifyPriority: usageList(verifyUsage),
  };
}

function renderText(report) {
  const lines = [];
  lines.push('Pokémon TCG Meta Coverage Audit');
  lines.push('='.repeat(31));
  lines.push(`Card source files scanned: ${report.scannedFiles}`);
  lines.push(`Curated decks audited: ${report.decks.length}`);
  lines.push('');

  for (const deck of report.decks) {
    lines.push(deck.name);
    lines.push(`  unique cards: ${deck.uniqueCards}`);
    lines.push(`  implemented:  ${deck.uniqueImplemented}`);
    lines.push(`  verify print: ${deck.uniqueVerify}`);
    lines.push(`  missing:      ${deck.uniqueMissing}`);

    const missing = deck.cards.filter(card => card.status === 'missing');
    if (missing.length) {
      lines.push('  missing cards:');
      for (const card of missing) {
        lines.push(`    - ${card.count}x ${card.name} ${card.set || ''} ${card.number || ''}`.trimEnd());
      }
    }

    const verify = deck.cards.filter(card => card.status === 'verify-printing');
    if (verify.length) {
      lines.push('  same-name cards requiring printing/effect verification:');
      for (const card of verify) {
        const locations = [...new Set(card.implementations.map(item => item.file))].join(', ');
        lines.push(`    - ${card.count}x ${card.name} ${card.set || ''} ${card.number || ''} -> ${locations}`.trimEnd());
      }
    }
    lines.push('');
  }

  if (report.missingPriority.length) {
    lines.push('Implementation priority (shared missing cards first)');
    lines.push('-'.repeat(52));
    for (const card of report.missingPriority) {
      lines.push(
        `${card.deckCount} deck(s), ${card.copies} copies: ${card.name} ${card.set || ''} ${card.number || ''}`.trimEnd()
      );
    }
    lines.push('');
  }

  if (report.verifyPriority.length) {
    lines.push('Printing verification queue');
    lines.push('-'.repeat(27));
    for (const card of report.verifyPriority) {
      lines.push(
        `${card.deckCount} deck(s), ${card.copies} copies: ${card.name} ${card.set || ''} ${card.number || ''}`.trimEnd()
      );
    }
  }

  return lines.join('\n');
}

function main() {
  const { index, scannedFiles } = buildImplementationIndex();
  const decks = loadDecks();
  const audit = auditDecks(decks, index);
  const report = { scannedFiles, ...audit };

  if (jsonOutput) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`${renderText(report)}\n`);
  }

  const unresolved = report.missingPriority.length + report.verifyPriority.length;
  if (failOnMissing && unresolved > 0) {
    process.exitCode = 2;
  }
}

try {
  main();
} catch (error) {
  console.error(`meta-audit failed: ${error.message}`);
  process.exitCode = 1;
}
