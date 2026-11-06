import * as fs from 'fs';
import * as path from 'path';
import { CardManager, DeckAnalyser, EnergyCard, EnergyType } from '@ptcg/common';

import {
  MODERN_STANDARD_NAME,
  modernBasicEnergies,
  modernStandardRules,
  modernStandardSets,
} from '../src/formats';
import * as standard from '../src/standard';

const DECK_FILE = path.resolve(__dirname, '../../../data/meta-decks/naic-2026-team-rocket-mewtwo.json');

// Cards of the Team Rocket's Mewtwo ex list that are not implemented yet.
// Remove a name here when its card lands; the test below then requires it.
const NOT_YET_IMPLEMENTED: string[] = [];

interface DeckEntry { count: number; name: string; set: string; basic?: boolean; }

function fullNameOf(entry: DeckEntry): string {
  if (entry.basic) {
    // Basic Energy is reused from the Diamond & Pearl set.
    const energy = modernBasicEnergies.find(c => c.name === entry.name);
    return energy ? energy.fullName : entry.name;
  }
  return `${entry.name} ${entry.set}`;
}

describe('Modern Standard format', () => {
  let cardManager: CardManager;

  beforeAll(() => {
    cardManager = CardManager.getInstance();
    if (!cardManager.getAllFormats().some(f => f.name === MODERN_STANDARD_NAME)) {
      cardManager.defineFormat(MODERN_STANDARD_NAME, modernStandardSets, modernStandardRules());
    }
  });

  it('uses today\'s first-turn rules', () => {
    const rules = modernStandardRules();
    expect(rules.firstTurnDrawCard).toBeTrue();
    expect(rules.firstTurnUseSupporter).toBeFalse();
    expect(rules.firstTurnAttack).toBeFalse();
  });

  it('includes the 8 basic Energy types and no Fairy Energy', () => {
    expect(modernBasicEnergies.length).toEqual(8);
    modernBasicEnergies.forEach(card => {
      expect(card instanceof EnergyCard && card.energyType === EnergyType.BASIC).toBeTrue();
    });
    expect(modernBasicEnergies.some(c => c.name === 'Fairy Energy')).toBeFalse();
  });

  it('does not include older-era sets', () => {
    const sets = modernStandardSets;
    expect(sets).not.toContain(standard.setBlackAndWhite);
    expect(sets).not.toContain(standard.setSwordAndShield);
    expect(sets).not.toContain(standard.setDiamondAndPearl);
  });

  it('has every implemented card of the Team Rocket\'s Mewtwo ex list', () => {
    const deck = JSON.parse(fs.readFileSync(DECK_FILE, 'utf8'));
    const entries: DeckEntry[] = deck.cards;
    const missing: string[] = [];

    entries.forEach(entry => {
      const name = fullNameOf(entry);
      const inFormat = cardManager.getCardFormats(name).some(f => f.name === MODERN_STANDARD_NAME);
      if (!inFormat) {
        missing.push(entry.name);
      }
    });

    expect(missing).toEqual(NOT_YET_IMPLEMENTED);
  });

  it('accepts the full 60-card Team Rocket\'s Mewtwo ex list as a valid deck', () => {
    const deck = JSON.parse(fs.readFileSync(DECK_FILE, 'utf8'));
    const names: string[] = [];
    (deck.cards as DeckEntry[]).forEach(entry => {
      for (let i = 0; i < entry.count; i++) {
        names.push(fullNameOf(entry));
      }
    });
    expect(names.length).toEqual(60);
    const analyser = new DeckAnalyser(names);
    expect(analyser.isValid()).toBeTrue();
    const formats = analyser.getDeckFormats().map(f => f.name);
    expect(formats).toContain(MODERN_STANDARD_NAME);
  });

  it('a deck may hold only 1 ACE SPEC card', () => {
    const fill = (n: number) => Array.from({ length: n }, () => 'Team Rocket\'s Tarountula DRI');
    // Only the 4-copy limit matters here, so build the rest from basic Energy.
    const energy = Array.from({ length: 54 }, () => 'Grass Energy EVO');
    const oneBelt = [...fill(4), ...energy, 'Lucky Helmet TWM', 'Maximum Belt TEF'];
    const twoBelts = [...fill(4), ...energy, 'Maximum Belt TEF', 'Maximum Belt TEF'];
    expect(new DeckAnalyser(oneBelt).isValid()).toBeTrue();
    expect(new DeckAnalyser(twoBelts).isValid()).toBeFalse();
  });
});
