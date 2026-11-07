/*
 * Builds the card image map in packages/common/src/game/card-images.ts.
 *
 * Upstream (ptcg.ryuu.eu) publishes no scans for the Scarlet & Violet sets, so
 * those cards have no artwork. pokemontcg.io does have them, but its image URLs
 * are keyed by set id and card number and our cards store neither: a card knows
 * only its name and a set code such as "TWM".
 *
 * This script bridges the two. It reads every card the sets package exports,
 * asks pokemontcg.io which set each code is (TWM -> sv6), fetches that set's
 * cards, matches them by name and writes out fullName -> image URL. The result
 * is committed, so a build never depends on the API being up.
 *
 * Usage: node scripts/fetch-card-images.js [--only SET,SET]
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT = path.join(__dirname, '../../common/src/game/card-images.ts');
const API = 'https://api.pokemontcg.io/v2';

// Sets whose artwork upstream does not host. Older sets already have scans.
const MODERN_SETS = ['SVI', 'PAL', 'OBF', 'MEW', 'PAR', 'PAF', 'TEF', 'TWM', 'SFA',
  'SCR', 'SSP', 'PRE', 'JTG', 'DRI', 'BLK', 'WHT', 'MEG', 'POR', 'ASC', 'CRI', 'PFL'];

function getJson(url, attempt = 1) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          // The cards endpoint returns 500/503 intermittently; retry a few times.
          if (attempt < 6) {
            return setTimeout(() => getJson(url, attempt + 1).then(resolve, reject), 4000 * attempt);
          }
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error(`Bad JSON from ${url}`));
        }
      });
    }).on('error', err => {
      if (attempt < 6) {
        return setTimeout(() => getJson(url, attempt + 1).then(resolve, reject), 4000 * attempt);
      }
      reject(err);
    });
  });
}

/** Reads the committed map back, so a rerun adds to it rather than replacing it. */
function readExistingMap() {
  const map = {};
  let text;
  try {
    text = fs.readFileSync(OUT, 'utf8');
  } catch (error) {
    return map;
  }
  const line = /^\s*'((?:[^'\\]|\\.)+)':\s*'((?:[^'\\]|\\.)+)',?\s*$/;
  const unescape = v => v.replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  text.split('\n').forEach(row => {
    const found = row.match(line);
    if (found) {
      map[unescape(found[1])] = unescape(found[2]);
    }
  });
  return map;
}

function ourCards() {
  const sets = require('../dist/cjs/index.js');
  const found = new Map();
  const walk = value => {
    if (Array.isArray(value)) {
      value.forEach(card => {
        if (card && card.set && card.fullName) {
          found.set(card.fullName, card);
        } else {
          walk(card);
        }
      });
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(walk);
    }
  };
  Object.values(sets).forEach(walk);
  return [...found.values()];
}

// "Dragapult ex" and "Dragapult EX" and "Dragapult-ex" should all match.
function normalise(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function main() {
  const only = (process.argv.find(a => a.startsWith('--only=')) || '').replace('--only=', '');
  const wanted = only ? only.split(',') : MODERN_SETS;

  const cards = ourCards();
  const bySet = new Map();
  cards.forEach(card => {
    if (!wanted.includes(card.set)) {
      return;
    }
    if (!bySet.has(card.set)) {
      bySet.set(card.set, []);
    }
    bySet.get(card.set).push(card);
  });

  // Start from what is already committed, so a run cut short by an API outage
  // adds to the map instead of throwing away everything found before.
  const map = readExistingMap();
  const startedWith = Object.keys(map).length;
  if (startedWith > 0) {
    console.log(`Starting from ${startedWith} cards already mapped.`);
  }

  const missing = [];
  const skipped = [];

  for (const [code, setCards] of [...bySet.entries()].sort()) {
    try {
    const sets = await getJson(`${API}/sets?q=ptcgoCode:${encodeURIComponent(code)}`);
    const match = (sets.data || [])[0];
    if (match === undefined) {
      setCards.forEach(c => missing.push(`${c.fullName} (no set for code ${code})`));
      console.log(`${code}: no matching set`);
      continue;
    }

    const remote = await getJson(`${API}/cards?q=set.id:${match.id}&pageSize=250`);
    const byName = new Map();
    (remote.data || []).forEach(rc => {
      const key = normalise(rc.name);
      // Keep the lowest number, which is the ordinary print rather than a
      // full-art reprint later in the set.
      const existing = byName.get(key);
      if (existing === undefined || parseInt(rc.number, 10) < parseInt(existing.number, 10)) {
        byName.set(key, rc);
      }
    });

    let hit = 0;
    setCards.forEach(card => {
      const rc = byName.get(normalise(card.name));
      if (rc && rc.images && rc.images.large) {
        map[card.fullName] = rc.images.large;
        hit++;
      } else {
        missing.push(`${card.fullName} (no card named "${card.name}" in ${match.id})`);
      }
    });
    console.log(`${code} -> ${match.id} (${match.name}): ${hit}/${setCards.length} matched`);
    } catch (error) {
      // pokemontcg.io returns 500/502/503 intermittently. Losing one set is far
      // better than losing the whole run; rerun later to fill the gap.
      skipped.push(`${code} (${error.message})`);
      console.log(`${code}: skipped, ${error.message}`);
    }
  }

  // The repo lints for single quotes with no escape exemption, so card names
  // containing an apostrophe (Boss's Orders) need it escaped.
  const q = value => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const entries = Object.keys(map).sort().map(k => `  ${q(k)}: ${q(map[k])},`);
  const file = `/**
 * Artwork for cards that upstream does not host a scan for.
 *
 * GENERATED by packages/sets/scripts/fetch-card-images.js - do not edit by hand.
 * Regenerate when cards are added: npm run compile -w packages/sets && node packages/sets/scripts/fetch-card-images.js
 *
 * Keyed by a card's fullName. The server's scan downloader prefers an entry
 * here over the configured scans host, so these cards get real artwork instead
 * of a broken image.
 */
export const cardImages: { [fullName: string]: string } = {
${entries.join('\n')}
};

/** The image URL for a card, if one is known. */
export function getCardImageUrl(fullName: string): string | undefined {
  return cardImages[fullName];
}
`;
  // Never shrink the map. An API outage skips sets, and silently writing a
  // smaller file would throw away artwork that was already found. Pass
  // --allow-shrink when cards have genuinely been removed.
  const total = Object.keys(map).length;
  if (total < startedWith && !process.argv.includes('--allow-shrink')) {
    console.error(`Refusing to write: would drop from ${startedWith} to ${total} cards. `
      + 'The API was probably unavailable. Rerun, or pass --allow-shrink if cards were removed.');
    process.exit(1);
  }

  fs.writeFileSync(OUT, file);
  console.log(`\nWrote ${OUT}: ${total} cards with artwork.`);
  if (skipped.length > 0) {
    console.log(`${skipped.length} set(s) skipped because the API was unavailable; rerun to fill them in:`);
    skipped.forEach(sk => console.log('  ' + sk));
  }
  if (missing.length > 0) {
    console.log(`${missing.length} without a match:`);
    missing.slice(0, 20).forEach(m => console.log('  ' + m));
    if (missing.length > 20) {
      console.log(`  ... and ${missing.length - 20} more.`);
    }
  }
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
