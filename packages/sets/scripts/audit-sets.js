#!/usr/bin/env node
/*
 * Card / set coverage audit for @ptcg/sets.
 *
 * Enumerates every set exported by packages/sets (via the compiled
 * dist/cjs build), classifies each card by how much of its printed text is
 * backed by game logic, and renders docs/SET_COVERAGE.md.
 *
 *   npm run compile -w packages/sets      # the audit reads dist/cjs
 *   npm run audit:sets -w packages/sets   # regenerate docs/SET_COVERAGE.md
 *   npm run audit:sets -w packages/sets -- --check   # exit 1 if stale
 *   npm run audit:sets -w packages/sets -- --json    # dump JSON to stdout
 *
 * The classifier itself (classifyCard) is pure and does not need the
 * compiled build, so tests/audit/audit-sets.spec.ts exercises it directly
 * against the TypeScript sources.
 *
 * This is deliberately plain JavaScript: it lives outside src/ and tests/,
 * so neither eslint nor tsc picks it up, and it runs without ts-node.
 *
 * Heuristics (see docs/SET_COVERAGE.md "Method" for the full write-up):
 *   - An attack "needs logic" when its text is non-empty or its damage is
 *     not a plain number ("30+", "10x", "20-" all need code).
 *   - Every Pokemon power (Poke-Power, Poke-Body, Ability, Ancient Trait)
 *     needs logic.
 *   - Every Trainer with text needs logic.
 *   - Basic Energy never needs logic. Special Energy needs logic unless its
 *     text only restates what `provides` / `provideAmount` already encode.
 *   - Cards in this repo dispatch on `effect.attack === this.attacks[i]` and
 *     `this.powers[i]`, so an attack/power i that needs logic is considered
 *     handled when the card's source references `attacks[i]` / `powers[i]`.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const PKG_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(PKG_DIR, 'src');
const TESTS_DIR = path.join(PKG_DIR, 'tests');
const REPO_ROOT = path.resolve(PKG_DIR, '..', '..');
const DEFAULT_OUT = path.join(REPO_ROOT, 'docs', 'SET_COVERAGE.md');

// Groups exported from src/index.ts, in display order.
const GROUPS = [
  { key: 'baseSets', dir: 'base-sets', label: 'Base sets' },
  { key: 'exSets', dir: 'ex-sets', label: 'EX sets' },
  { key: 'standardSets', dir: 'standard', label: 'Standard (curated)' },
];

// Official printed set sizes. Only listed where certain; the "standard"
// folders are curated cross-set collections (cards carry their real set code
// in fullName, e.g. "Bianca EPO"), so no official size applies to them.
//
// `distinct` is the number of different cards in the set. Jungle, Fossil and
// Team Rocket print each holo rare twice (holo and non-holo, identical text);
// this repo implements each card once, so coverage is measured against the
// distinct count, not the printed card numbers.
const OFFICIAL_SIZES = {
  setBase: { size: 102, note: '' },
  setJungle: { size: 64, distinct: 48, note: '16 holos also printed non-holo' },
  setFossil: { size: 62, distinct: 47, note: '15 holos also printed non-holo' },
  setTeamRocket: { size: 83, distinct: 66, note: '82 + secret Dark Raichu; 17 holos also printed non-holo' },
  setRubyAndSapphire: { size: 109, note: '' },
  setSandstorm: { size: 100, note: '' },
  setFireredAndLeafgreen: { size: 116, note: '112 + 4 secret' },
};

// Hand-review notes for flagged cards, keyed by repo-relative source path.
// Shown next to the flag so the generated doc carries the triage result.
// Remove an entry once the card is fixed (the flag will disappear too).
const REVIEW_NOTES = {
  'packages/sets/src/base-sets/set-base/potion.ts':
    'Bug: logic lives in a method named `potion()`, not `reduceEffect()`, so the card does nothing when played.',
  'packages/sets/src/standard/set-op9/rotom.ts':
    'Bug: handler checks `this.attacks[1]` but Poltergeist is `attacks[0]`; the +10 per Trainer never applies.',
  'packages/sets/src/standard/set-black-and-white-2/oddish.ts':
    'Bug: Find a Friend searches the deck without flipping a coin.',
  'packages/sets/src/ex-sets/set-firered-and-leafgreen/pokedex-handy909.ts':
    'Likely bug: text says shuffle first; code reorders the top 6 without shuffling.',
  'packages/sets/src/standard/set-black-and-white-2/evosoda.ts':
    'Minor: deck is never shuffled after the search.',
  'packages/sets/src/standard/set-diamond-and-pearl/sableye.ts':
    'Minor: Impersonate searches the deck but never shuffles it.',
  'packages/sets/src/base-sets/set-base/devolution-spray.ts':
    'False positive: conditions are cleared by `pokemonSlot.clearEffects()`.',
  'packages/sets/src/standard/set-black-and-white-2/virbank-city-gym.ts':
    'False positive: Poisoned is only referenced (`poisonDamage += 20`).',
  'packages/sets/src/base-sets/set-fossil/ditto.ts':
    'Commented out of the Fossil index; TODOs for copying passive Abilities.',
};

// Markers that mean "someone left this unfinished".
const TODO_RE = /\b(TODO|FIXME|XXX|HACK)\b|not[ -]implemented|unimplemented/i;

// Special energy text that only restates provides/provideAmount.
// e.g. "Provides C C energy." / "Double Colorless Energy provides C C Energy."
// Energy symbols must be single capital letters, so "provides every type of
// Energy" (Rainbow / Multi Energy) does not match.
const ENERGY_PROVIDES_ONLY_RE =
  /^\s*(?:[A-Z][\w' -]*? )?[Pp]rovides? (?:[A-Z]\b\s*)+[Ee]nergy\.?\s*(?:\(?[Dd]oesn'?t count as a basic [Ee]nergy(?: card)?\.?\)?)?\s*$/;

// Attack text that has no effect in the single-battle engine. Only the
// EX-era doubles clause exists today (Seaking RS "Fast Stream").
const SINGLES_NOOP_RE =
  /^[^()]*\(Ignore this effect if your opponent has only 1 Defending Pok[eé]mon\.\)\s*$/;

const PLAIN_DAMAGE_RE = /^\d*$/;

// Advisory cross-checks: card text mentions a mechanic, but the class source
// has none of the code that mechanic normally needs. These do not change a
// card's status; they are listed separately for human review.
const SHARED_HELPERS = 'common(?:Attacks|Powers|Trainers)';
const KEYWORD_CHECKS = [
  { name: 'coin flip', text: /\bflips?\b/i,
    code: new RegExp('CoinFlipPrompt|' + SHARED_HELPERS) },
  { name: 'shuffle', text: /\bshuffle/i,
    code: new RegExp('Shuffle|shuffle|' + SHARED_HELPERS) },
  { name: 'special condition', text: /\b(?:asleep|paralyzed|poisoned|burned|confused)\b/i,
    code: new RegExp('SpecialCondition|' + SHARED_HELPERS) },
];

// ---------------------------------------------------------------------------
// Pure classification
// ---------------------------------------------------------------------------

/**
 * Lists the parts of a card's printed text that require code.
 * Returns [{ kind: 'attack'|'power'|'trainer'|'energy', index, name }].
 */
function requiredLogic(card) {
  const items = [];
  if (Array.isArray(card.attacks)) {
    card.attacks.forEach((a, i) => {
      const text = (a.text || '').trim();
      const damage = String(a.damage === undefined ? '' : a.damage).trim();
      const plainDamage = PLAIN_DAMAGE_RE.test(damage);
      if (plainDamage && SINGLES_NOOP_RE.test(text)) {
        return; // doubles-only effect: nothing to do in a 1v1 game
      }
      if (text !== '' || !plainDamage) {
        items.push({ kind: 'attack', index: i, name: a.name });
      }
    });
  }
  if (Array.isArray(card.powers)) {
    card.powers.forEach((p, i) => items.push({ kind: 'power', index: i, name: p.name }));
  }
  if (card.superType === SUPER_TYPE.TRAINER && (card.text || '').trim() !== '') {
    items.push({ kind: 'trainer', index: 0, name: card.name });
  }
  if (card.superType === SUPER_TYPE.ENERGY && card.energyType === ENERGY_TYPE.SPECIAL) {
    const text = (card.text || '').trim();
    if (text !== '' && !ENERGY_PROVIDES_ONLY_RE.test(text)) {
      items.push({ kind: 'energy', index: 0, name: card.name });
    }
  }
  return items;
}

// Mirrors @ptcg/common enums; kept local so classifyCard stays dependency-free.
// Values are checked against the real enums in loadFromDist().
const SUPER_TYPE = { POKEMON: 1, TRAINER: 2, ENERGY: 3 };
const ENERGY_TYPE = { BASIC: 0, SPECIAL: 1 };

/**
 * Classifies one card.
 *
 * @param card            card instance
 * @param source          concatenated TypeScript source of the card's class
 * @param hasReduceEffect whether the class overrides Card.reduceEffect
 * @returns { status, missing: [...], todo: bool }
 *   status: 'vanilla' | 'implemented' | 'partial' | 'needs-logic'
 */
function classifyCard(card, source, hasReduceEffect) {
  const required = requiredLogic(card);
  const todo = TODO_RE.test(stripStrings(source || ''));

  if (required.length === 0) {
    return { status: todo ? 'partial' : 'vanilla', missing: [], todo, warnings: [] };
  }
  if (!hasReduceEffect) {
    return { status: 'needs-logic', missing: required, todo, warnings: [] };
  }

  const src = source || '';
  const missing = required.filter(item => {
    if (item.kind === 'attack') {
      return !refersTo(src, 'attacks', item.index);
    }
    if (item.kind === 'power') {
      // Passive powers (Poke-Bodies, Ancient Traits) that can't be blocked
      // are sometimes implemented without touching powers[i]; accept a code
      // comment naming the power, e.g. "// Delta Plus" in Articuno ROS.
      return !refersTo(src, 'powers', item.index) &&
        !commentMentions(src, item.name);
    }
    return false; // trainer / energy: an override is the only signal we have
  });

  // References past the end of the list can never match (e.g. a card with
  // one attack that dispatches on this.attacks[1]).
  ['attacks', 'powers'].forEach(field => {
    const length = Array.isArray(card[field]) ? card[field].length : 0;
    indexReferences(src, field).filter(i => i >= length).forEach(i => {
      missing.push({ kind: 'dangling', index: i, name: field });
    });
  });

  const status = missing.length > 0 || todo ? 'partial' : 'implemented';
  return { status, missing, todo, warnings: keywordWarnings(card, src) };
}

/** Advisory text-vs-code mismatches; see KEYWORD_CHECKS. */
function keywordWarnings(card, src) {
  const texts = [].concat(
    (card.attacks || []).map(a => a.text || ''),
    (card.powers || []).map(p => p.text || ''),
    [card.text || '']
  );
  const code = stripStrings(src);
  return KEYWORD_CHECKS
    .filter(c => texts.some(t => c.text.test(t)) && !c.code.test(code))
    .map(c => c.name);
}

function refersTo(src, field, index) {
  return indexReferences(src, field).includes(index);
}

/** Indices i used as this.<field>[i] (or self.<field>[i]) in code. */
function indexReferences(src, field) {
  const re = new RegExp('\\b(?:this|self)\\.' + field + '\\s*\\[\\s*(\\d+)\\s*\\]', 'g');
  const code = stripStrings(src);
  const found = new Set();
  let m;
  while ((m = re.exec(code)) !== null) {
    found.add(Number(m[1]));
  }
  return Array.from(found).sort((a, b) => a - b);
}

// True when `name` appears in a line or block comment of `src`.
function commentMentions(src, name) {
  const comments = stripStrings(src).match(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g) || [];
  const needle = name.toLowerCase();
  return comments.some(c => c.toLowerCase().includes(needle));
}

/** Removes string literals so card text like "TODO" can't trip TODO_RE. */
function stripStrings(src) {
  return src.replace(/'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g, '\'\'');
}

// ---------------------------------------------------------------------------
// Repository discovery
// ---------------------------------------------------------------------------

function readText(file) {
  return fs.readFileSync(file, 'utf8');
}

/** Parses a set's index.ts: export name + className -> source file. */
function parseSetIndex(setDir) {
  const indexFile = path.join(setDir, 'index.ts');
  const text = readText(indexFile);
  const exportMatch = /export const (\w+)\s*:/.exec(text);
  const classes = {};
  const importRe = /^[ \t]*import\s*\{([^}]+)\}\s*from\s*'(\.\/[^']+)'/gm;
  let m;
  while ((m = importRe.exec(text)) !== null) {
    const file = path.join(setDir, m[2] + '.ts');
    m[1].split(',').map(s => s.trim()).filter(Boolean).forEach(spec => {
      const parts = spec.split(/\s+as\s+/);
      classes[(parts[1] || parts[0]).trim()] = { file, exported: parts[0].trim() };
    });
  }
  const imported = new Set(Object.values(classes).map(c => c.file));
  const unexported = fs.readdirSync(setDir)
    .filter(f => f.endsWith('.ts') && f !== 'index.ts')
    .map(f => path.join(setDir, f))
    .filter(f => !imported.has(f))
    .sort();
  return { exportName: exportMatch ? exportMatch[1] : null, classes, unexported };
}

/** Parses cardManager.defineFormat('Name', [group.setX, ...]) from init.js. */
function parseFormats(initFile) {
  const formats = {};
  if (!fs.existsSync(initFile)) {
    return formats;
  }
  const text = readText(initFile);
  const re = /defineFormat\(\s*'([^']+)'\s*,\s*\[([^\]]*)\]/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const name = m[1];
    (m[2].match(/\.(\w+)/g) || []).forEach(ref => {
      const setName = ref.slice(1);
      (formats[setName] = formats[setName] || []).push(name);
    });
  }
  return formats;
}

/** Map of "<group>/<set-dir>" -> Set of card file basenames with a spec. */
function collectSpecs() {
  const specs = {};
  const walk = dir => {
    if (!fs.existsSync(dir)) {
      return;
    }
    fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.spec.ts')) {
        const rel = path.relative(TESTS_DIR, dir).split(path.sep).join('/');
        (specs[rel] = specs[rel] || new Set()).add(entry.name.replace(/\.spec\.ts$/, ''));
      }
    });
  };
  walk(TESTS_DIR);
  return specs;
}

function loadFromDist() {
  const distIndex = path.join(PKG_DIR, 'dist', 'cjs', 'index.js');
  if (!fs.existsSync(distIndex)) {
    throw new Error('Missing ' + path.relative(REPO_ROOT, distIndex) +
      ': run `npm run compile -w packages/sets` first.');
  }
  const common = require('@ptcg/common');
  // Guard the local enum mirrors used by classifyCard.
  if (common.SuperType.TRAINER !== SUPER_TYPE.TRAINER ||
      common.SuperType.ENERGY !== SUPER_TYPE.ENERGY ||
      common.SuperType.POKEMON !== SUPER_TYPE.POKEMON ||
      common.EnergyType.SPECIAL !== ENERGY_TYPE.SPECIAL ||
      common.EnergyType.BASIC !== ENERGY_TYPE.BASIC) {
    throw new Error('SuperType/EnergyType enum values changed; update audit-sets.js');
  }
  return { sets: require(distIndex), common };
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function buildReport() {
  const { sets, common } = loadFromDist();
  const baseReduce = common.Card.prototype.reduceEffect;
  const formats = parseFormats(path.join(REPO_ROOT, 'init.js'));
  const specs = collectSpecs();
  const report = { groups: [] };

  GROUPS.forEach(group => {
    const groupDir = path.join(SRC_DIR, group.dir);
    const exported = sets[group.key] || {};
    const setDirs = fs.readdirSync(groupDir, { withFileTypes: true })
      .filter(e => e.isDirectory() && e.name.startsWith('set-'))
      .map(e => e.name)
      .sort();

    const groupReport = { label: group.label, dir: group.dir, sets: [] };
    setDirs.forEach(setDirName => {
      const setDir = path.join(groupDir, setDirName);
      const index = parseSetIndex(setDir);
      const cards = exported[index.exportName] || [];
      const specKey = group.dir + '/' + setDirName;
      const specFiles = specs[specKey] || new Set();
      const setCodes = new Set();

      const describe = (card, file) => {
        const source = file && fs.existsSync(file) ? readText(file) : '';
        const hasReduceEffect = card.reduceEffect !== baseReduce;
        const result = classifyCard(card, source, hasReduceEffect);
        const base = file ? path.basename(file, '.ts') : null;
        return {
          name: card.name,
          fullName: card.fullName,
          file: file ? path.relative(REPO_ROOT, file).split(path.sep).join('/') : '(unknown)',
          superType: card.superType,
          status: result.status,
          missing: result.missing,
          todo: result.todo,
          warnings: result.warnings,
          hasSpec: base !== null && specFiles.has(base),
        };
      };

      const cardReports = cards.map(card => {
        setCodes.add(card.set);
        const entry = index.classes[card.constructor.name];
        return describe(card, entry ? entry.file : null);
      });

      // Card files in the folder that the set's index.ts does not export
      // (e.g. commented out). Loaded straight from their compiled module.
      const unexportedCards = [];
      index.unexported.forEach(file => {
        const rel = path.relative(SRC_DIR, file).replace(/\.ts$/, '.js');
        const distFile = path.join(PKG_DIR, 'dist', 'cjs', rel);
        let mod = {};
        try {
          mod = require(distFile);
        } catch (e) {
          unexportedCards.push({ name: path.basename(file, '.ts'), fullName: '(not compiled)',
            file: path.relative(REPO_ROOT, file).split(path.sep).join('/'), status: 'unknown',
            missing: [], todo: false, hasSpec: false });
          return;
        }
        Object.keys(mod).sort().forEach(key => {
          const Ctor = mod[key];
          if (typeof Ctor === 'function' && Ctor.prototype instanceof common.Card) {
            unexportedCards.push(describe(new Ctor(), file));
          }
        });
      });

      // Specs whose name doesn't match any card file in this set.
      const cardBases = new Set(cardReports.map(c => path.basename(c.file, '.ts')));
      const orphanSpecs = Array.from(specFiles).filter(s => !cardBases.has(s)).sort();

      const official = OFFICIAL_SIZES[index.exportName];
      groupReport.sets.push({
        dir: setDirName,
        exportName: index.exportName,
        setCodes: Array.from(setCodes).sort(),
        official: official ? official.size : null,
        officialDistinct: official ? (official.distinct || official.size) : null,
        officialNote: official ? official.note : '',
        formats: formats[index.exportName] || [],
        cards: cardReports,
        unexportedCards,
        orphanSpecs,
        counts: countStatuses(cardReports),
      });
    });
    report.groups.push(groupReport);
  });

  report.totals = countStatuses(
    [].concat(...report.groups.map(g => [].concat(...g.sets.map(s => s.cards))))
  );
  return report;
}

function countStatuses(cards) {
  const counts = { total: cards.length, implemented: 0, vanilla: 0, partial: 0,
    'needs-logic': 0, specs: 0 };
  cards.forEach(c => {
    counts[c.status]++;
    if (c.hasSpec) {
      counts.specs++;
    }
  });
  return counts;
}

function pct(n, d) {
  // One decimal, rounded down, so 859/861 reads 99.7% rather than 100%.
  return d === 0 ? '-' : (Math.floor((1000 * n) / d) / 10) + '%';
}

function note(card) {
  return REVIEW_NOTES[card.file] || 'not yet reviewed';
}

function describeMissing(card) {
  const parts = card.missing.map(m => {
    switch (m.kind) {
      case 'attack': return 'attack[' + m.index + '] "' + m.name + '"';
      case 'power': return 'power[' + m.index + '] "' + m.name + '"';
      case 'trainer': return 'trainer text';
      case 'dangling': return 'references this.' + m.name + '[' + m.index + '], which does not exist';
      default: return 'special energy text';
    }
  });
  if (card.todo) {
    parts.push('TODO marker in source');
  }
  return parts.join('; ');
}

function renderMarkdown(report) {
  const out = [];
  const t = report.totals;
  const complete = t.implemented + t.vanilla;
  out.push('# Card / set coverage');
  out.push('');
  out.push('<!-- Generated by packages/sets/scripts/audit-sets.js. Do not edit by hand. -->');
  out.push('<!-- Regenerate: npm run compile -w packages/sets && npm run audit:sets -w packages/sets -->');
  out.push('');
  out.push('Static audit of every card exported by `@ptcg/sets`. Each card is classified by');
  out.push('whether the parts of its printed text that need game logic are referenced by');
  out.push('its `reduceEffect`. This is a heuristic, not a rules check: "implemented" means');
  out.push('the code *dispatches on* the attack/power, not that the effect is correct.');
  out.push('');
  out.push('## Totals');
  out.push('');
  out.push('| Cards | Implemented | Vanilla | Complete | Partial | Needs logic | With spec |');
  out.push('| ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  out.push('| ' + [t.total, t.implemented, t.vanilla,
    complete + ' (' + pct(complete, t.total) + ')', t.partial, t['needs-logic'],
    t.specs + ' (' + pct(t.specs, t.total) + ')'].join(' | ') + ' |');
  out.push('');
  out.push('- **Implemented** — needs logic, and every attack/power that needs logic is');
  out.push('  referenced from the class (`attacks[i]` / `powers[i]`); Trainers and Special');
  out.push('  Energy count when they override `reduceEffect`.');
  out.push('- **Vanilla** — nothing on the card needs code: attacks with plain numeric');
  out.push('  damage and no text, no powers, basic Energy, or Special Energy whose text only');
  out.push('  restates `provides`. Counted as complete.');
  out.push('- **Partial** — overrides `reduceEffect` but never references at least one');
  out.push('  attack/power that has text, or the source carries a TODO/FIXME marker.');
  out.push('- **Needs logic** — has text that needs code but no `reduceEffect` override.');
  out.push('- **With spec** — a `tests/<group>/<set>/<card-file>.spec.ts` exists.');
  out.push('');

  out.push('## Per set');
  out.push('');
  out.push('Official sizes are listed only where certain. "Standard" folders are curated');
  out.push('collections drawn from many printed sets (card set codes shown), so they have no');
  out.push('official size. "Present" counts entries in the exported set array; alternate');
  out.push('prints of the same name (e.g. `Charmander RG-2`) count separately. The percentage');
  out.push('is measured against the number of *distinct* cards: Jungle, Fossil and Team Rocket');
  out.push('print every holo rare a second time as a non-holo with identical text, and those');
  out.push('reprints are implemented once.');
  out.push('');
  report.groups.forEach(group => {
    out.push('### ' + group.label);
    out.push('');
    out.push('| Set (export) | Codes | Present | Official | Impl. | Vanilla | Partial | Needs logic | Specs | Formats |');
    out.push('| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |');
    group.sets.forEach(s => {
      const c = s.counts;
      let official = '';
      if (s.official !== null) {
        const distinct = s.officialDistinct !== s.official ? ', ' + s.officialDistinct + ' distinct' : '';
        official = s.official + ' (' + (s.officialNote ? s.officialNote : '') + distinct + ')';
        official = official.replace(' ()', '').replace('(, ', '(') +
          ' — ' + pct(s.cards.length, s.officialDistinct);
      }
      out.push('| ' + [
        '`' + s.dir + '` (`' + s.exportName + '`)',
        s.setCodes.join(', '),
        s.cards.length,
        official,
        c.implemented,
        c.vanilla,
        c.partial,
        c['needs-logic'],
        c.specs,
        s.formats.join(', ') || '(none)',
      ].join(' | ') + ' |');
    });
    out.push('');
  });

  const flagged = [];
  report.groups.forEach(g => g.sets.forEach(s => s.cards.forEach(c => {
    if (c.status === 'partial' || c.status === 'needs-logic') {
      flagged.push({ set: s.dir, card: c });
    }
  })));
  out.push('## Suspected stubs / incomplete cards');
  out.push('');
  if (flagged.length === 0) {
    out.push('None flagged.');
  } else {
    out.push('| Set | Card | Status | Unhandled | Review note | File |');
    out.push('| --- | --- | --- | --- | --- | --- |');
    flagged.forEach(f => {
      out.push('| ' + [f.set, f.card.fullName, f.card.status, describeMissing(f.card),
        note(f.card), '`' + f.card.file + '`'].join(' | ') + ' |');
    });
  }
  out.push('');

  const warned = [];
  report.groups.forEach(g => g.sets.forEach(s => s.cards.forEach(c => {
    if (c.warnings && c.warnings.length > 0) {
      warned.push({ set: s.dir, card: c });
    }
  })));
  out.push('## Text/code keyword mismatches (advisory)');
  out.push('');
  out.push('The card text mentions a mechanic but the class source contains none of the');
  out.push('code that mechanic normally needs (`CoinFlipPrompt`, a shuffle, `SpecialCondition`,');
  out.push('or a shared `common*` helper). Some are legitimate (the condition is only');
  out.push('*referenced*, not inflicted); review by hand. Status above is unaffected.');
  out.push('');
  if (warned.length === 0) {
    out.push('None.');
  } else {
    out.push('| Set | Card | Text mentions | Review note | File |');
    out.push('| --- | --- | --- | --- | --- |');
    warned.forEach(f => {
      out.push('| ' + [f.set, f.card.fullName, f.card.warnings.join(', '),
        note(f.card), '`' + f.card.file + '`'].join(' | ') + ' |');
    });
  }
  out.push('');

  const unexported = [];
  report.groups.forEach(g => g.sets.forEach(s => s.unexportedCards.forEach(c =>
    unexported.push({ set: s.dir, card: c }))));
  if (unexported.length > 0) {
    out.push('## Card files not exported by their set');
    out.push('');
    out.push('Present in the set folder but not in the set\'s exported array (usually');
    out.push('commented out in `index.ts`), so they are not playable and not counted above.');
    out.push('');
    out.push('| Set | Card | Status if enabled | Unhandled | Review note | File |');
    out.push('| --- | --- | --- | --- | --- | --- |');
    unexported.forEach(f => {
      out.push('| ' + [f.set, f.card.fullName, f.card.status, describeMissing(f.card) || '-',
        note(f.card), '`' + f.card.file + '`'].join(' | ') + ' |');
    });
    out.push('');
  }

  const orphans = [];
  report.groups.forEach(g => g.sets.forEach(s => s.orphanSpecs.forEach(o =>
    orphans.push('`tests/' + g.dir + '/' + s.dir + '/' + o + '.spec.ts`'))));
  if (orphans.length > 0) {
    out.push('## Specs not matched to a card file');
    out.push('');
    orphans.forEach(o => out.push('- ' + o));
    out.push('');
  }

  out.push('## Method and limits');
  out.push('');
  out.push('- Cards are read from the compiled `packages/sets/dist/cjs` export; class names are');
  out.push('  mapped back to source files through each set\'s `index.ts` imports.');
  out.push('- Cards in this repo dispatch with `effect.attack === this.attacks[i]` and');
  out.push('  `this.powers[i]`; the audit checks for those references textually. A card');
  out.push('  that referenced an attack some other way (by name, via a loop) would be');
  out.push('  reported as partial. A `this.attacks[i]` / `this.powers[i]` reference past the');
  out.push('  end of the list is reported as a dangling reference.');
  out.push('- Passive powers that cannot be blocked (e.g. Ancient Traits) are sometimes');
  out.push('  implemented without touching `powers[i]`; a code comment naming the power');
  out.push('  (`// Delta Plus`) is accepted as a reference for powers only.');
  out.push('- An attack needs logic when its text is non-empty or its damage is not a plain');
  out.push('  number (`30+`, `10×`). Text that only matters in double battles ("Ignore this');
  out.push('  effect if your opponent has only 1 Defending Pokémon") needs none. Every power');
  out.push('  needs logic. Every Trainer with text needs logic; an override is the only');
  out.push('  signal checked for Trainers and Special Energy. Special Energy whose text only');
  out.push('  restates `provides` (Double Colorless Energy) is vanilla.');
  out.push('- Card text is taken from the class itself. A card whose printed text was left');
  out.push('  out of the class would look vanilla; the audit cannot detect that without an');
  out.push('  external card database.');
  out.push('- Missing cards in a set are counted against the distinct-card count but not named,');
  out.push('  for the same reason.');
  out.push('- Engine-level rules (Pokémon-ex prize count, Stadium/Supporter play limits) are');
  out.push('  not card text and are not audited.');
  out.push('- "Implemented" does not mean correct; only cards with a spec have behavioural');
  out.push('  evidence. TODO markers are searched outside string literals.');
  out.push('');
  return out.join('\n');
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function main(argv) {
  const args = argv.slice(2);
  const report = buildReport();
  if (args.includes('--json')) {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    return 0;
  }
  const outIdx = args.indexOf('--out');
  const outFile = outIdx >= 0 ? path.resolve(args[outIdx + 1]) : DEFAULT_OUT;
  const markdown = renderMarkdown(report);
  if (args.includes('--check')) {
    const current = fs.existsSync(outFile) ? readText(outFile) : '';
    if (current !== markdown) {
      process.stderr.write(path.relative(REPO_ROOT, outFile) +
        ' is out of date; run `npm run audit:sets -w packages/sets`.\n');
      return 1;
    }
    process.stdout.write(path.relative(REPO_ROOT, outFile) + ' is up to date.\n');
    return 0;
  }
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, markdown);
  const t = report.totals;
  process.stdout.write('Wrote ' + path.relative(REPO_ROOT, outFile) + ': ' + t.total +
    ' cards, ' + t.implemented + ' implemented, ' + t.vanilla + ' vanilla, ' + t.partial +
    ' partial, ' + t['needs-logic'] + ' needs logic, ' + t.specs + ' with spec.\n');
  return 0;
}

module.exports = { classifyCard, requiredLogic, keywordWarnings, stripStrings, parseFormats, parseSetIndex,
  buildReport, renderMarkdown, SUPER_TYPE, ENERGY_TYPE };

if (require.main === module) {
  try {
    process.exitCode = main(process.argv);
  } catch (e) {
    process.stderr.write(String(e && e.message ? e.message : e) + '\n');
    process.exitCode = 2;
  }
}
