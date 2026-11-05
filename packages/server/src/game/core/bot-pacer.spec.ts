import { BotPacer } from './bot-pacer';

describe('BotPacer', () => {
  let pacer: BotPacer;
  let passed: number;

  const tick = () => new Promise<void>(resolve => setTimeout(resolve, 0));

  function waitAndCount(): void {
    pacer.wait().then(() => { passed++; });
  }

  beforeEach(() => {
    pacer = new BotPacer();
    passed = 0;
  });

  it('holds the bot until Continue', async () => {
    waitAndCount();
    await tick();
    expect(passed).toBe(0);
    expect(pacer.isWaiting).toBeTrue();

    pacer.step();
    await tick();
    expect(passed).toBe(1);
    expect(pacer.isWaiting).toBeFalse();
  });

  it('lets exactly one move through per Continue', async () => {
    waitAndCount();
    pacer.step();
    await tick();
    waitAndCount();
    await tick();
    expect(passed).toBe(1);
    expect(pacer.isWaiting).toBeTrue();
  });

  it('keeps an early Continue for the next move, but does not add presses up', async () => {
    pacer.step();
    pacer.step();
    waitAndCount();
    await tick();
    expect(passed).toBe(1);

    waitAndCount();
    await tick();
    expect(passed).toBe(1);
  });

  it('drops an unused Continue on clear', async () => {
    pacer.step();
    pacer.clear();
    waitAndCount();
    await tick();
    expect(passed).toBe(0);
  });

  it('lets the waiting move and every later move through once released', async () => {
    waitAndCount();
    pacer.release();
    await tick();
    expect(passed).toBe(1);
    expect(pacer.isReleased).toBeTrue();

    waitAndCount();
    waitAndCount();
    await tick();
    expect(passed).toBe(3);
  });
});
