import * as fs from 'fs';
import * as path from 'path';
import { Card } from '@ptcg/common';

import { Abra } from '../../src/base-sets/set-base/abra';
import { Bill } from '../../src/base-sets/set-base/bill';
import { Diglett } from '../../src/base-sets/set-base/diglett';
import { DoubleColorlessEnergy } from '../../src/base-sets/set-base/double-colorless-energy';
import { WaterEnergy } from '../../src/base-sets/set-base/water-energy';
import { Seaking } from '../../src/ex-sets/set-ruby-and-sapphire/seaking';
import { Articuno } from '../../src/standard/set-black-and-white-3/articuno';
import { Oddish } from '../../src/standard/set-black-and-white-2/oddish';

// Plain JS module outside src/; see packages/sets/scripts/audit-sets.js.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const audit = require('../../scripts/audit-sets');

const SRC = path.join(__dirname, '..', '..', 'src');

function classify(card: Card, file: string) {
  const source = fs.readFileSync(path.join(SRC, file), 'utf8');
  return audit.classifyCard(card, source, card.reduceEffect !== Card.prototype.reduceEffect);
}

describe('audit-sets classifier', () => {

  it('Should mark an attack with text and a matching handler as implemented', () => {
    const result = classify(new Abra(), 'base-sets/set-base/abra.ts');
    expect(result.status).toBe('implemented');
    expect(result.missing).toEqual([]);
  });

  it('Should mark plain-damage attacks with no text as vanilla', () => {
    expect(classify(new Diglett(), 'base-sets/set-base/diglett.ts').status).toBe('vanilla');
  });

  it('Should mark basic energy and provides-only special energy as vanilla', () => {
    expect(classify(new WaterEnergy(), 'base-sets/set-base/water-energy.ts').status).toBe('vanilla');
    expect(classify(new DoubleColorlessEnergy(), 'base-sets/set-base/double-colorless-energy.ts').status)
      .toBe('vanilla');
  });

  it('Should mark a trainer with a reduceEffect override as implemented', () => {
    expect(classify(new Bill(), 'base-sets/set-base/bill.ts').status).toBe('implemented');
  });

  it('Should mark a trainer without a reduceEffect override as needs-logic', () => {
    const card = new Bill();
    const result = audit.classifyCard(card, '', false);
    expect(result.status).toBe('needs-logic');
    expect(result.missing.map((m: any) => m.kind)).toEqual(['trainer']);
  });

  it('Should flag an attack with text that the handler never references', () => {
    const card = new Abra();
    const source = 'reduceEffect() { if (effect.attack === this.attacks[1]) {} }';
    const result = audit.classifyCard(card, source, true);
    expect(result.status).toBe('partial');
    expect(result.missing.map((m: any) => m.kind + m.index)).toEqual(['attack0', 'dangling1']);
  });

  it('Should accept a code comment naming a passive power', () => {
    expect(classify(new Articuno(), 'standard/set-black-and-white-3/articuno.ts').status).toBe('implemented');
  });

  it('Should treat doubles-only attack text as needing no logic', () => {
    const items = audit.requiredLogic(new Seaking());
    expect(items.map((i: any) => i.name)).toEqual(['Water Arrow']);
  });

  it('Should ignore TODO inside string literals', () => {
    const card = new Diglett();
    expect(audit.classifyCard(card, 'const s = \'TODO\';', false).todo).toBe(false);
    expect(audit.classifyCard(card, '// TODO', false).status).toBe('partial');
  });

  it('Should report coin-flip text with no coin-flip code as an advisory warning', () => {
    // Oddish UND used to skip its coin flip; simulate that source by removing the prompt.
    const card = new Oddish();
    const source = fs.readFileSync(path.join(SRC, 'standard/set-black-and-white-2/oddish.ts'), 'utf8')
      .replace(/CoinFlipPrompt/g, 'RemovedPrompt');
    const result = audit.classifyCard(card, source, true);
    expect(result.status).toBe('implemented');
    expect(result.warnings).toEqual(['coin flip']);
  });

  it('Should not warn once the coin flip is implemented', () => {
    const result = classify(new Oddish(), 'standard/set-black-and-white-2/oddish.ts');
    expect(result.status).toBe('implemented');
    expect(result.warnings).toEqual([]);
  });

});
