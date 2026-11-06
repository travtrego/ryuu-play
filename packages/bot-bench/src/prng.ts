/**
 * Small, fast, seedable PRNG (mulberry32). The harness never calls
 * Math.random(): every shuffle and coin flip in a benchmark game is drawn
 * from an instance of this class, so a game is fully reproducible from its
 * seed.
 */
export class Prng {

  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Uniform float in [0, 1). */
  public next(): number {
    this.state = (this.state + 0x6D2B79F5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Uniform integer in [0, n). */
  public nextInt(n: number): number {
    return Math.floor(this.next() * n);
  }

  public nextBoolean(): boolean {
    return this.next() < 0.5;
  }

}

/**
 * Derives an independent 32-bit seed for game `index` of a run seeded with
 * `seed`. Each game gets its own seed so a single game can be replayed in
 * isolation (see the `--game-seed` CLI option).
 */
export function deriveSeed(seed: number, index: number): number {
  let h = (seed >>> 0) ^ Math.imul((index + 1) >>> 0, 0x9E3779B1);
  h = Math.imul(h ^ (h >>> 16), 0x85EBCA6B);
  h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35);
  h ^= h >>> 16;
  return h >>> 0;
}
