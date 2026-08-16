import { AttachEnergyPrompt, Card, CardTarget, ChooseCardsPrompt, ChoosePokemonPrompt,
  ConfirmPrompt, PokemonSlot, Prompt, SelectPrompt, ShowCardsPrompt, ShuffleDeckPrompt,
  SlotType } from '@ptcg/common';

// GameMessage values are SCREAMING_SNAKE identifiers such as
// 'CHOOSE_NEW_ACTIVE_POKEMON'. Rendering them raw at a learner is unhelpful,
// so they are turned into a readable sentence.
export function humanizeGameMessage(message: string): string {
  const text = message.replace(/_/g, ' ').toLowerCase().trim();

  if (text.length === 0) {
    return text;
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function describeRange(min: number, max: number): string {
  if (min === max) {
    return `choose ${min}`;
  }
  return `choose ${min}-${max}`;
}

export function describeCardTarget(target: CardTarget): string {
  if (target.slot === SlotType.ACTIVE) {
    return 'the Active Spot';
  }
  if (target.slot === SlotType.BENCH) {
    return `bench slot ${target.index + 1}`;
  }
  return humanizeGameMessage(SlotType[target.slot]);
}

// Renders the question the engine is asking, so a learner sees the decision
// rather than an opaque prompt type.
export function describePrompt(prompt: Prompt<any>): string {
  const message = (prompt as any).message;
  const question = typeof message === 'string' ? humanizeGameMessage(message) : prompt.type;

  if (prompt instanceof ChooseCardsPrompt || prompt instanceof ChoosePokemonPrompt) {
    return `${question} (${describeRange(prompt.options.min, prompt.options.max)})`;
  }

  if (prompt instanceof SelectPrompt) {
    return `${question} (${prompt.values.join(' / ')})`;
  }

  return question;
}

function isCardArray(value: any[]): boolean {
  return value.every(item => item instanceof Card);
}

function isPokemonSlotArray(value: any[]): boolean {
  return value.every(item => item instanceof PokemonSlot);
}

function describePokemonSlot(slot: PokemonSlot): string {
  const pokemon = slot.getPokemonCard();
  return pokemon === undefined ? 'an empty slot' : pokemon.name;
}

// Renders a chosen answer to a prompt. `result` is whatever that prompt type
// resolves to, so this deliberately handles each shape rather than assuming
// one. A null result means the player declined, where the prompt allows it.
export function describePromptResult(prompt: Prompt<any>, result: any): string {
  if (result === null || result === undefined) {
    return 'Decline';
  }

  if (prompt instanceof ConfirmPrompt) {
    return result === true ? 'Yes' : 'No';
  }

  // Mechanical steps rather than decisions. Their results are a deck
  // permutation and a bare acknowledgement, neither of which is worth
  // rendering literally - a 60-entry shuffle order is noise, not advice.
  if (prompt instanceof ShuffleDeckPrompt) {
    return 'Shuffle your deck';
  }

  if (prompt instanceof ShowCardsPrompt) {
    return 'Acknowledge';
  }

  if (prompt instanceof SelectPrompt) {
    const value = prompt.values[result];
    return value === undefined ? String(result) : value;
  }

  if (prompt instanceof AttachEnergyPrompt && Array.isArray(result)) {
    if (result.length === 0) {
      return 'Attach nothing';
    }
    return result
      .map(assign => `${assign.card.name} to ${describeCardTarget(assign.to)}`)
      .join(', ');
  }

  if (Array.isArray(result)) {
    if (result.length === 0) {
      return 'Choose nothing';
    }
    if (isCardArray(result)) {
      return result.map(card => card.name).join(', ');
    }
    if (isPokemonSlotArray(result)) {
      return result.map(describePokemonSlot).join(', ');
    }
  }

  if (typeof result === 'boolean') {
    return result ? 'Yes' : 'No';
  }

  return String(result);
}
