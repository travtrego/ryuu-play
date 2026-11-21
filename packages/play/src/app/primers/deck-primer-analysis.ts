import { Card, CardTag, CardType, EnergyCard, ModernDeck, PokemonCard, Stage, SuperType,
  TrainerCard, TrainerType } from '@ptcg/common';

/**
 * Learn mode, tutorial piece 4: the generated half of a deck primer.
 *
 * Everything here is read from the card data the client already has (the same card
 * objects the table plays with), so it cannot drift from what the cards do: the
 * evolution lines, how many Prize cards each Pokémon gives up, Weakness, the attacks
 * with their cost and damage, and the deck's make-up. The written half (game plan,
 * tips) is in `deck-primers.ts`.
 */

export type CardLookup = (fullName: string) => Card | undefined;

export interface PrimerAttack {
  name: string;
  /** Energy cost as type names, e.g. ['Fire', 'Psychic']. */
  cost: string[];
  /** Printed damage, e.g. '200', '60×', '30+', or '' when the attack does no printed damage. */
  damage: string;
}

export interface PrimerPokemon {
  /** Card fullName, e.g. 'Dragapult ex TWM'. */
  fullName: string;
  name: string;
  count: number;
  stage: string;
  hp: number;
  /** Prize cards the opponent takes for Knocking it Out: 1, 2 (Pokémon ex) or 3 (Mega Evolution Pokémon ex). */
  prizes: number;
  weakness: string;
  retreat: number;
  abilities: string[];
  attacks: PrimerAttack[];
  card: Card;
}

/** A Basic and the Pokémon that evolve from it in this deck, Basic first. */
export interface PrimerLine {
  /** One step per stage; a step can hold several prints of the same stage (e.g. two Riolu). */
  steps: PrimerPokemon[][];
  /**
   * Set when the line starts with an Evolution Pokémon whose pre-evolution is not in the
   * deck (it is reached another way, e.g. Rare Candy, or only used from the discard pile).
   */
  missingEvolvesFrom?: string;
}

export interface PrimerCount {
  label: string;
  count: number;
}

export interface DeckPrimerAnalysis {
  lines: PrimerLine[];
  pokemonCount: number;
  trainerCount: number;
  energyCount: number;
  /** Supporters, Items, Pokémon Tools, Stadiums (only the kinds the deck has). */
  trainerKinds: PrimerCount[];
  /** Energy by card name, e.g. 'Fire Energy' 4. */
  energies: PrimerCount[];
  /** Copies of Pokémon ex that are not Mega (2 Prizes each). */
  exCount: number;
  /** Copies of Mega Evolution Pokémon ex (3 Prizes each). */
  megaExCount: number;
  /** Card names the client does not know (should be empty; the page says so if not). */
  unknown: string[];
}

const TYPE_NAMES: { [type: number]: string } = {
  [CardType.COLORLESS]: 'Colorless',
  [CardType.GRASS]: 'Grass',
  [CardType.FIGHTING]: 'Fighting',
  [CardType.PSYCHIC]: 'Psychic',
  [CardType.WATER]: 'Water',
  [CardType.LIGHTNING]: 'Lightning',
  [CardType.METAL]: 'Metal',
  [CardType.DARK]: 'Darkness',
  [CardType.FIRE]: 'Fire',
  [CardType.DRAGON]: 'Dragon',
  [CardType.FAIRY]: 'Fairy',
};

export function typeName(type: CardType): string {
  return TYPE_NAMES[type] || 'Colorless';
}

function stageName(stage: Stage): string {
  switch (stage) {
    case Stage.STAGE_1: return 'Stage 1';
    case Stage.STAGE_2: return 'Stage 2';
    case Stage.RESTORED: return 'Restored';
    default: return 'Basic';
  }
}

/** Prize cards given up when Knocked Out, by the same tags the engine reads (game-effect.ts). */
export function prizeValue(card: PokemonCard): number {
  if (card.tags.includes(CardTag.MEGA_EVOLUTION_EX)) {
    return 3;
  }
  if (card.tags.includes(CardTag.POKEMON_EX)) {
    return 2;
  }
  return 1;
}

function toPrimerPokemon(card: PokemonCard, count: number): PrimerPokemon {
  return {
    fullName: card.fullName,
    name: card.name,
    count,
    stage: stageName(card.stage),
    hp: card.hp,
    prizes: prizeValue(card),
    weakness: card.weakness.map(w => typeName(w.type)).join(', '),
    retreat: card.retreat.length,
    abilities: card.powers.map(p => p.name),
    attacks: card.attacks.map(a => ({
      name: a.name,
      cost: a.cost.map(t => typeName(t)),
      damage: formatDamage(a.damage)
    })),
    card
  };
}

function formatDamage(damage: string | number): string {
  const text = String(damage === undefined || damage === null ? '' : damage).trim();
  return text === '0' ? '' : text;
}

function trainerKindName(type: TrainerType): string {
  switch (type) {
    case TrainerType.SUPPORTER: return 'Supporters';
    case TrainerType.STADIUM: return 'Stadiums';
    case TrainerType.TOOL: return 'Pokémon Tools';
    default: return 'Items';
  }
}

const TRAINER_ORDER = ['Supporters', 'Items', 'Pokémon Tools', 'Stadiums'];

export function analyseDeck(deck: ModernDeck, lookup: CardLookup): DeckPrimerAnalysis {
  const pokemon: PrimerPokemon[] = [];
  const trainerKinds = new Map<string, number>();
  const energies: PrimerCount[] = [];
  const unknown: string[] = [];
  let pokemonCount = 0;
  let trainerCount = 0;
  let energyCount = 0;

  for (const [fullName, count] of deck.cards) {
    const card = lookup(fullName);
    if (card === undefined) {
      unknown.push(fullName);
      continue;
    }
    switch (card.superType) {
      case SuperType.POKEMON:
        pokemonCount += count;
        pokemon.push(toPrimerPokemon(card as PokemonCard, count));
        break;
      case SuperType.TRAINER: {
        trainerCount += count;
        const kind = trainerKindName((card as TrainerCard).trainerType);
        trainerKinds.set(kind, (trainerKinds.get(kind) || 0) + count);
        break;
      }
      case SuperType.ENERGY: {
        energyCount += count;
        const name = (card as EnergyCard).name;
        const existing = energies.find(e => e.label === name);
        if (existing) {
          existing.count += count;
        } else {
          energies.push({ label: name, count });
        }
        break;
      }
    }
  }

  return {
    lines: buildLines(pokemon),
    pokemonCount,
    trainerCount,
    energyCount,
    trainerKinds: TRAINER_ORDER
      .filter(kind => trainerKinds.has(kind))
      .map(kind => ({ label: kind, count: trainerKinds.get(kind) || 0 })),
    energies,
    exCount: sum(pokemon.filter(p => p.prizes === 2)),
    megaExCount: sum(pokemon.filter(p => p.prizes === 3)),
    unknown
  };
}

function sum(list: PrimerPokemon[]): number {
  return list.reduce((total, p) => total + p.count, 0);
}

/**
 * Groups the Pokémon into evolution lines by `evolvesFrom` (a card name). A Pokémon whose
 * pre-evolution is not in the deck (e.g. a Stage 1 reached only through a Rare Candy-style
 * effect, or a Stage 2 whose Stage 1 the list skips) starts a line of its own.
 */
function buildLines(pokemon: PrimerPokemon[]): PrimerLine[] {
  const byName = new Map<string, PrimerPokemon[]>();
  for (const p of pokemon) {
    const list = byName.get(p.name) || [];
    list.push(p);
    byName.set(p.name, list);
  }

  const evolvesFrom = (p: PrimerPokemon) => (p.card as PokemonCard).evolvesFrom;
  const hasParent = (p: PrimerPokemon) => evolvesFrom(p) !== '' && byName.has(evolvesFrom(p));

  const lines: PrimerLine[] = [];
  const used = new Set<string>();
  for (const p of pokemon) {
    if (used.has(p.name) || hasParent(p)) {
      continue;
    }
    const steps: PrimerPokemon[][] = [];
    let names = [p.name];
    while (names.length > 0) {
      const step: PrimerPokemon[] = [];
      for (const name of names) {
        used.add(name);
        step.push(...(byName.get(name) || []));
      }
      steps.push(step);
      const next = pokemon.filter(c => !used.has(c.name) && names.includes(evolvesFrom(c)));
      names = Array.from(new Set(next.map(c => c.name)));
    }
    const line: PrimerLine = { steps };
    if (evolvesFrom(p) !== '') {
      line.missingEvolvesFrom = evolvesFrom(p);
    }
    lines.push(line);
  }
  return lines;
}
