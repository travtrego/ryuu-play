import { BotAiFactory, BotFlipMode, BotShuffleMode } from '@ptcg/common';
import { SimpleBot, SimpleBotOptions, allSimpleTactics } from '@ptcg/simple-bot';

export interface BotVariant {
  name: string;
  description: string;
  create: (playerName: string) => BotAiFactory;
}

function withoutTactics(...names: string[]): Partial<SimpleBotOptions> {
  for (const name of names) {
    if (!allSimpleTactics.some(t => t.name === name)) {
      throw new Error(`simple-bot has no tactic named ${name}`);
    }
  }
  return { tactics: allSimpleTactics.filter(t => !names.includes(t.name)) };
}

/**
 * Rejects SimpleBot options whose internal look-ahead arbiter uses
 * Math.random() (BotFlipMode.RANDOM / BotShuffleMode.RANDOM). Such a bot
 * makes non-reproducible decisions, which would silently break the
 * harness's same-seed-same-result guarantee.
 */
export function assertDeterministicOptions(options: Partial<SimpleBotOptions>): void {
  const arbiter = options.arbiter;
  if (arbiter === undefined) {
    return;
  }
  if (arbiter.flipMode === BotFlipMode.RANDOM || arbiter.shuffleMode === BotShuffleMode.RANDOM) {
    throw new Error('SimpleBot arbiter RANDOM modes use Math.random() and are not deterministic; '
      + 'use ALL_HEADS/ALL_TAILS/CUSTOM and NO_SHUFFLE/REVERSE in benchmarks.');
  }
}

export function simpleBotVariant(
  name: string,
  description: string,
  options: Partial<SimpleBotOptions> = {}
): BotVariant {
  assertDeterministicOptions(options);
  return {
    name,
    description,
    create: playerName => new SimpleBot(playerName, options)
  };
}

export const botVariants: BotVariant[] = [
  simpleBotVariant('default', 'SimpleBot with its default tactics, resolvers and scores'),
  simpleBotVariant('no-retreat', 'SimpleBot without RetreatTactic', withoutTactics('RetreatTactic')),
  simpleBotVariant('no-trainers', 'SimpleBot without PlayTrainerTactic and PlaySupporterTactic',
    withoutTactics('PlayTrainerTactic', 'PlaySupporterTactic')),
];

export function findBotVariant(name: string): BotVariant {
  const found = botVariants.find(v => v.name === name);
  if (found === undefined) {
    throw new Error(`Unknown bot variant "${name}". Known variants: ${botVariants.map(v => v.name).join(', ')}`);
  }
  return found;
}
