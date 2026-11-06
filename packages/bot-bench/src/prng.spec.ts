import { CoinFlipPrompt, GameMessage, Player, ShuffleDeckPrompt, State, CardList, Card } from '@ptcg/common';
import { Prng, deriveSeed } from './prng';
import { SeededArbiter } from './seeded-arbiter';

function sequence(seed: number, n: number): number[] {
  const prng = new Prng(seed);
  return Array.from({ length: n }, () => prng.next());
}

describe('Prng', () => {

  it('produces the same sequence for the same seed', () => {
    expect(sequence(42, 100)).toEqual(sequence(42, 100));
  });

  it('produces different sequences for different seeds', () => {
    expect(sequence(1, 20)).not.toEqual(sequence(2, 20));
  });

  it('stays in [0, 1) and nextInt stays in range', () => {
    const prng = new Prng(7);
    for (let i = 0; i < 10000; i++) {
      const x = prng.next();
      expect(x >= 0 && x < 1).toBe(true);
      const k = prng.nextInt(6);
      expect(Number.isInteger(k) && k >= 0 && k < 6).toBe(true);
    }
  });

  it('is roughly fair', () => {
    const prng = new Prng(123);
    let heads = 0;
    for (let i = 0; i < 10000; i++) {
      heads += prng.nextBoolean() ? 1 : 0;
    }
    expect(heads).toBeGreaterThan(4800);
    expect(heads).toBeLessThan(5200);
  });

  it('deriveSeed is deterministic and gives distinct per-game seeds', () => {
    const seeds = Array.from({ length: 1000 }, (_, i) => deriveSeed(1, i));
    expect(new Set(seeds).size).toBe(1000);
    expect(deriveSeed(1, 5)).toBe(seeds[5]);
    expect(deriveSeed(2, 5)).not.toBe(seeds[5]);
  });

});

describe('SeededArbiter', () => {

  function makeState(deckSize: number): State {
    const state = new State();
    const player = new Player();
    player.id = 1;
    player.name = 'p1';
    player.deck = new CardList();
    for (let i = 0; i < deckSize; i++) {
      player.deck.cards.push({ fullName: 'c' + i } as unknown as Card);
    }
    state.players = [player];
    return state;
  }

  it('resolves a shuffle prompt with a permutation, reproducibly', () => {
    const state = makeState(60);
    const prompt = new ShuffleDeckPrompt(1);
    const a = new SeededArbiter(new Prng(9)).resolvePrompt(state, prompt);
    const b = new SeededArbiter(new Prng(9)).resolvePrompt(state, prompt);
    const c = new SeededArbiter(new Prng(10)).resolvePrompt(state, prompt);
    expect(a).toBeDefined();
    const order: number[] = a!.result;
    expect(order.slice().sort((x, y) => x - y)).toEqual(Array.from({ length: 60 }, (_, i) => i));
    expect(b!.result).toEqual(order);
    expect(c!.result).not.toEqual(order);
  });

  it('resolves coin flips with a log line and ignores other prompts', () => {
    const state = makeState(1);
    const arbiter = new SeededArbiter(new Prng(3));
    const flip = arbiter.resolvePrompt(state, new CoinFlipPrompt(1, GameMessage.COIN_FLIP));
    expect(typeof flip!.result).toBe('boolean');
    expect(flip!.log).toBeDefined();
    expect(arbiter.resolvePrompt(state, new CoinFlipPrompt(99, GameMessage.COIN_FLIP))).toBeUndefined();
  });

  it('never calls Math.random', () => {
    const spy = spyOn(Math, 'random').and.callThrough();
    const state = makeState(60);
    const arbiter = new SeededArbiter(new Prng(1));
    arbiter.resolvePrompt(state, new ShuffleDeckPrompt(1));
    arbiter.resolvePrompt(state, new CoinFlipPrompt(1, GameMessage.COIN_FLIP));
    expect(spy).not.toHaveBeenCalled();
  });

});
