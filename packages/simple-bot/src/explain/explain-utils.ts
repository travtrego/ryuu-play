import { Attack, CardTarget, CardType, EnergyMap, Player, PokemonCard, PokemonSlot,
  SlotType, SpecialCondition, State, StateUtils } from '@ptcg/common';

/**
 * Small, side-effect free helpers used to turn a bot decision into a short
 * plain-language sentence. Nothing here changes what the bot does; it only
 * describes the states the bot already compared.
 */

export function getOpponent(state: State, player: Player): Player | undefined {
  return state.players.find(p => p.id !== player.id);
}

export function getPlayerById(state: State, playerId: number): Player | undefined {
  return state.players.find(p => p.id === playerId);
}

/** Slot on the bot's own side for a BOTTOM_PLAYER target. */
export function getOwnSlot(player: Player, target: CardTarget): PokemonSlot | undefined {
  if (target.slot === SlotType.ACTIVE) {
    return player.active;
  }
  if (target.slot === SlotType.BENCH) {
    return player.bench[target.index];
  }
  return undefined;
}

export function pokemonName(slot: PokemonSlot | undefined): string {
  const card = slot && slot.getPokemonCard();
  return card ? card.name : 'a Pokémon';
}

export function joinList(items: string[]): string {
  if (items.length <= 1) {
    return items.join('');
  }
  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}

export function plural(n: number, word: string): string {
  // "Energy" is used as an uncountable noun on cards ("2 Energy").
  return n === 1 || word.endsWith('Energy') ? `${n} ${word}` : `${n} ${word}s`;
}

/** Energy on the slot, as the engine's cost checker expects it. */
export function getEnergyMap(slot: PokemonSlot): EnergyMap[] {
  return slot.energies.cards.map(card => ({
    card,
    provides: card.provides,
    provideAmount: card.provideAmount
  }));
}

export function canPay(slot: PokemonSlot, cost: CardType[]): boolean {
  return StateUtils.checkEnoughEnergy(getEnergyMap(slot), cost);
}

/** Attacks of the slot's Pokémon whose Energy cost is covered. */
export function payableAttacks(slot: PokemonSlot): Attack[] {
  const card = slot.getPokemonCard();
  if (card === undefined) {
    return [];
  }
  return card.attacks.filter(a => canPay(slot, a.cost));
}

/**
 * How many more Energy the cost needs, counting units only (matching the
 * coarse view the bot's EnergyScore uses). 0 means payable.
 */
export function missingEnergyCount(slot: PokemonSlot, cost: CardType[]): number {
  if (canPay(slot, cost)) {
    return 0;
  }
  let provided = 0;
  slot.energies.cards.forEach(c => { provided += c.provideAmount; });
  return Math.max(1, cost.length - provided);
}

export const CONDITION_NAMES: { [key: number]: string } = {
  [SpecialCondition.PARALYZED]: 'Paralyzed',
  [SpecialCondition.CONFUSED]: 'Confused',
  [SpecialCondition.ASLEEP]: 'Asleep',
  [SpecialCondition.POISONED]: 'Poisoned',
  [SpecialCondition.BURNED]: 'Burned'
};

function topCardId(slot: PokemonSlot): number | undefined {
  const card = slot.getPokemonCard();
  return card ? card.id : undefined;
}

function inPlay(player: Player): PokemonSlot[] {
  return [ player.active, ...player.bench ].filter(s => s.pokemons.cards.length > 0);
}

function findByCardId(player: Player, id: number | undefined): PokemonSlot | undefined {
  if (id === undefined) {
    return undefined;
  }
  return inPlay(player).find(s => s.pokemons.cards.some(c => c.id === id));
}

/**
 * Concrete differences between the state before the bot's action and the
 * state the bot's own simulation predicts after it. Phrases are written from
 * the bot's point of view ("draws 2 cards", "Knocks Out Pikachu").
 */
export function describeChanges(before: State, after: State, playerId: number): string[] {
  const facts: string[] = [];
  const me0 = getPlayerById(before, playerId);
  const me1 = getPlayerById(after, playerId);
  if (me0 === undefined || me1 === undefined) {
    return facts;
  }
  const op0 = getOpponent(before, me0);
  const op1 = getOpponent(after, me1);

  // Opponent's Pokémon: Knock Outs, damage, Special Conditions.
  if (op0 !== undefined && op1 !== undefined) {
    const knockedOut: string[] = [];
    inPlay(op0).forEach(slot0 => {
      const slot1 = findByCardId(op1, topCardId(slot0));
      const name = pokemonName(slot0);
      if (slot1 === undefined) {
        knockedOut.push(name);
        return;
      }
      const dealt = slot1.damage - slot0.damage;
      if (dealt > 0) {
        facts.push(`puts ${dealt} damage on ${name}`);
      }
    });
    if (knockedOut.length > 0) {
      facts.push(`Knocks Out ${joinList(knockedOut)}`);
    }

    const active0 = op0.active;
    const active1 = findByCardId(op1, topCardId(active0));
    if (active1 !== undefined && active1 !== op1.active && op1.active.pokemons.cards.length > 0) {
      facts.push(`brings ${pokemonName(op1.active)} out as the opponent's Active Pokémon`);
    }
    if (active1 !== undefined) {
      const added = active1.specialConditions.filter(c => !active0.specialConditions.includes(c));
      if (added.length > 0) {
        facts.push(`makes ${pokemonName(active0)} ${joinList(added.map(c => CONDITION_NAMES[c]))}`);
      }
    }

    const energy0 = inPlay(op0).reduce((n, s) => n + s.energies.cards.length, 0);
    const energy1 = inPlay(op1).reduce((n, s) => n + s.energies.cards.length, 0);
    if (energy1 < energy0 && knockedOut.length === 0) {
      facts.push(`removes ${plural(energy0 - energy1, 'Energy')} from the opponent`);
    }

    const opHandLost = op0.hand.cards.length - op1.hand.cards.length;
    if (opHandLost > 0 && after.activePlayer === before.activePlayer) {
      facts.push(`takes ${plural(opHandLost, 'card')} out of the opponent's hand`);
    }
  }

  // Prize cards.
  const prizes = me0.getPrizeLeft() - me1.getPrizeLeft();
  if (prizes > 0) {
    facts.push(`takes ${plural(prizes, 'Prize card')}`);
  }

  // Own side: switching, healing, conditions cured, new Bench Pokémon.
  const ownActive1Id = topCardId(me1.active);
  const ownActive0Id = topCardId(me0.active);
  if (ownActive1Id !== undefined && ownActive0Id !== undefined
    && !me0.active.pokemons.cards.some(c => c.id === ownActive1Id)) {
    facts.push(`makes ${pokemonName(me1.active)} the Active Pokémon`);
  }

  const sameTurn = after.activePlayer === before.activePlayer;
  inPlay(me0).forEach(slot0 => {
    const slot1 = findByCardId(me1, topCardId(slot0));
    if (slot1 === undefined) {
      return;
    }
    if (slot1.damage < slot0.damage) {
      facts.push(`heals ${slot0.damage - slot1.damage} damage from ${pokemonName(slot0)}`);
    }
    if (sameTurn && slot1.damage > slot0.damage) {
      facts.push(`puts ${slot1.damage - slot0.damage} damage on its own ${pokemonName(slot0)}`);
    }
    const energy = slot1.energies.cards.length - slot0.energies.cards.length;
    if (sameTurn && energy > 0) {
      facts.push(`attaches ${plural(energy, 'Energy')} to ${pokemonName(slot0)}`);
    }
  });

  const cured = me0.active.specialConditions.filter(c => {
    const slot1 = findByCardId(me1, topCardId(me0.active));
    return slot1 !== undefined && !slot1.specialConditions.includes(c);
  });
  if (cured.length > 0 && sameTurn) {
    facts.push(`stops ${pokemonName(me0.active)} being ${joinList(cured.map(c => CONDITION_NAMES[c]))}`);
  }

  const benched: string[] = [];
  me1.bench.forEach(slot1 => {
    if (slot1.pokemons.cards.length === 0) {
      return;
    }
    const id = topCardId(slot1);
    const wasInPlay = inPlay(me0).some(s => s.pokemons.cards.some(c => c.id === id));
    if (!wasInPlay) {
      benched.push(pokemonName(slot1));
    }
  });
  if (benched.length > 0) {
    facts.push(`puts ${joinList(benched)} on the Bench`);
  }

  // Cards taken from the deck (draws or searches), only within the bot's own turn
  // so the next turn's normal draw is not counted.
  if (sameTurn) {
    const fromDeck = me0.deck.cards.length - me1.deck.cards.length;
    if (fromDeck > 0) {
      facts.push(`gets ${plural(fromDeck, 'card')} from its deck`);
    }
  }

  return facts;
}

export function describeEvolution(from: PokemonCard, to: PokemonCard): string {
  const parts: string[] = [];
  if (to.hp > from.hp) {
    parts.push(`HP goes from ${from.hp} to ${to.hp}`);
  }
  const strongest = (card: PokemonCard) => card.attacks
    .reduce((max, a) => Math.max(max, parseInt(a.damage, 10) || 0), 0);
  if (strongest(to) > strongest(from)) {
    parts.push(`its strongest attack goes from ${strongest(from)} to ${strongest(to)} damage`);
  }
  return joinList(parts);
}
