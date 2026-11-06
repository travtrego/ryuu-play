import { Card, CardType, EnergyCard, GamePhase, Player, PokemonCard, PokemonSlot, Stage, State, StateUtils,
  SuperType, TrainerCard } from '@ptcg/common';

/**
 * Learn mode: the lesson script for the tutorial game.
 *
 * A tutorial game (`core:createTutorialGame`, marked by `state.rules.tutorial`)
 * deals both decks in a fixed order, so the lessons below happen on cue. Each
 * lesson is one concept. A "do" lesson tells the player what to do and is done
 * when the game state shows they did it; then the coach says why it mattered.
 * A "read" lesson explains something and is done when the player clicks
 * "Got it".
 *
 * How rigid it is (decided 2026-11-04): the coach **guides, it does not block**.
 * Every move the engine allows is still allowed. The lesson is worked out from
 * the game state each time it changes, so an off-script move simply moves the
 * coach along: a lesson the player already did out of order counts as done, and
 * a lesson that cannot happen right now waits instead of holding up the others.
 *
 * Every instruction and explanation is built from the cards actually in play or
 * in the player's own hand, so the text cannot drift from the game. It reads
 * only what the player can already see: their own hand and the public board.
 *
 * After the last lesson the game rolls on as a normal game; the Tips panel
 * keeps helping.
 */

export type TutorialLessonKind = 'do' | 'read';

export interface TutorialContext {
  state: State;
  me: Player;
  opponent: Player;
  myTurn: boolean;
}

export interface TutorialLesson {
  id: string;
  kind: TutorialLessonKind;
  /** Section id on the rules page (/rules#<section>), see RULES_SECTIONS. */
  section: string;
  /** The lesson can start now. A lesson that is not ready waits; it does not block the others. */
  ready(ctx: TutorialContext): boolean;
  /** What to do now ("do"), or the explanation itself ("read"). */
  text(ctx: TutorialContext): string;
  /** "do" lessons: the game state shows the player did it. */
  done?(ctx: TutorialContext): boolean;
  /** "do" lessons: why it mattered, said once it is done. */
  why?(ctx: TutorialContext): string;
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

function isPokemon(card: Card): card is PokemonCard {
  return card.superType === SuperType.POKEMON;
}

function isEnergy(card: Card): card is EnergyCard {
  return card.superType === SuperType.ENERGY;
}

function isTrainer(card: Card): card is TrainerCard {
  return card.superType === SuperType.TRAINER;
}

function inPlay(player: Player): PokemonSlot[] {
  return [player.active, ...player.bench].filter(slot => slot.getPokemonCard() !== undefined);
}

function onMyTurn(ctx: TutorialContext): boolean {
  return ctx.myTurn && ctx.state.phase === GamePhase.PLAYER_TURN;
}

function activeName(player: Player): string {
  const card = player.active.getPokemonCard();
  return card ? card.name : 'your Active Pokémon';
}

function energyCount(slot: PokemonSlot): number {
  return slot.energies.cards.length;
}

/**
 * Attacks the Active Pokémon has enough Energy for, by the cards' printed
 * Energy. Good enough to choose the words of a lesson; the engine still decides
 * what is legal.
 */
export function payableAttacks(slot: PokemonSlot): string[] {
  const pokemon = slot.getPokemonCard();
  if (pokemon === undefined) {
    return [];
  }
  const energy = slot.energies.cards.map(card => ({
    card, provides: card.provides, provideAmount: card.provideAmount
  }));
  return pokemon.attacks
    .filter(attack => StateUtils.checkEnoughEnergy(energy, attack.cost))
    .map(attack => attack.name);
}

/** A draw Trainer in hand, the safest one to teach with: it can't fail for want of a target. */
function drawTrainer(player: Player): TrainerCard | undefined {
  return player.hand.cards
    .filter(isTrainer)
    .find(card => card.text.startsWith('Draw '));
}

/** An evolution in hand whose Basic has been in play since before this turn. */
function evolution(ctx: TutorialContext): { card: PokemonCard, base: PokemonCard } | undefined {
  for (const card of ctx.me.hand.cards) {
    if (!isPokemon(card) || card.stage === Stage.BASIC || !card.evolvesFrom) {
      continue;
    }
    // Same check as the engine: no evolving on the turn it came into play.
    const slot = inPlay(ctx.me).find(s => {
      const pokemon = s.getPokemonCard();
      return pokemon !== undefined && pokemon.name === card.evolvesFrom && s.pokemonPlayedTurn < ctx.state.turn;
    });
    if (slot !== undefined) {
      return { card, base: slot.getPokemonCard() as PokemonCard };
    }
  }
  return undefined;
}

function weaknessText(pokemon: PokemonCard): string {
  if (pokemon.weakness.length === 0) {
    return `${pokemon.name} has no Weakness.`;
  }
  const parts = pokemon.weakness.map(w => w.value === undefined
    ? `${typeName(w.type)} attacks do double damage to it`
    : `${typeName(w.type)} attacks do ${w.value} more damage to it`);
  return `${pokemon.name} is weak to ${pokemon.weakness.map(w => typeName(w.type)).join(' and ')}: ${parts.join(', ')}.`;
}

/** Prizes the player has taken. The Prizes are dealt at the end of setup, so none before that. */
function prizesTaken(ctx: TutorialContext, player: Player): number {
  const phase = ctx.state.phase;
  if (phase === GamePhase.WAITING_FOR_PLAYERS || phase === GamePhase.SETUP || player.prizes.length === 0) {
    return 0;
  }
  return player.prizes.length - player.getPrizeLeft();
}

export const TUTORIAL_LESSONS: TutorialLesson[] = [
  {
    id: 'setup',
    kind: 'do',
    section: 'setup',
    ready: ctx => ctx.state.phase === GamePhase.SETUP,
    text: ctx => {
      const basic = ctx.me.hand.cards.find(card => isPokemon(card) && card.stage === Stage.BASIC);
      const name = basic ? basic.name : 'a Basic Pokémon';
      return `Choose ${name} as your Active Pokémon: the one that does the fighting. `
        + 'Leave your other Pokémon in your hand for now; you will Bench one in a moment.';
    },
    done: ctx => ctx.state.phase !== GamePhase.SETUP && ctx.state.phase !== GamePhase.WAITING_FOR_PLAYERS,
    why: () => 'Both players also set aside 6 Prize cards, face down. Each time you Knock Out one of the bot\'s '
      + 'Pokémon you take one. Take all 6 and you win.'
  },
  {
    id: 'took-prize',
    kind: 'read',
    section: 'goal',
    ready: ctx => prizesTaken(ctx, ctx.me) > 0,
    text: ctx => {
      const left = ctx.me.getPrizeLeft();
      return `You Knocked Out one of the bot's Pokémon and took a Prize card into your hand. `
        + `${left} more and you win. When a Pokémon is Knocked Out, its owner must send a new Active Pokémon `
        + 'up from the Bench.';
    }
  },
  {
    id: 'lost-prize',
    kind: 'read',
    section: 'goal',
    ready: ctx => prizesTaken(ctx, ctx.opponent) > 0,
    text: () => 'The bot Knocked Out one of your Pokémon and took a Prize. Its damage, Energy and any evolution '
      + 'cards went to your discard pile. Send up a Pokémon from your Bench and keep going: this is why a '
      + 'Bench matters.'
  },
  {
    id: 'energy',
    kind: 'do',
    section: 'energy',
    ready: ctx => onMyTurn(ctx) && ctx.me.hand.cards.some(isEnergy),
    text: ctx => {
      const energy = ctx.me.hand.cards.find(isEnergy) as EnergyCard;
      return `Drag ${energy.name} from your hand onto ${activeName(ctx.me)}.`;
    },
    done: ctx => inPlay(ctx.me).some(slot => energyCount(slot) > 0),
    why: ctx => {
      const slot = inPlay(ctx.me).find(s => energyCount(s) > 0) as PokemonSlot;
      const pokemon = slot.getPokemonCard() as PokemonCard;
      const costs = pokemon.attacks.map(a => `${a.name} needs ${a.cost.length}`).join(', ');
      return `Attacks cost Energy: the symbols next to each attack. ${pokemon.name}'s ${costs}. `
        + 'You can attach only one Energy card per turn, so attach one every turn.';
    }
  },
  {
    id: 'bench',
    kind: 'do',
    section: 'tips',
    ready: ctx => onMyTurn(ctx) && ctx.me.hand.cards.some(card => isPokemon(card) && card.stage === Stage.BASIC),
    text: ctx => {
      const basic = ctx.me.hand.cards.find(card => isPokemon(card) && card.stage === Stage.BASIC) as PokemonCard;
      return `Drag ${basic.name} from your hand onto an empty spot in your Bench, the row below your Active Pokémon.`;
    },
    done: ctx => ctx.me.bench.some(slot => slot.getPokemonCard() !== undefined),
    why: () => 'If your Active Pokémon is Knocked Out and your Bench is empty, you lose the game. '
      + 'A Benched Pokémon is ready to step in, and you can give it Energy while it waits.'
  },
  {
    id: 'trainer',
    kind: 'do',
    section: 'trainers',
    ready: ctx => onMyTurn(ctx) && drawTrainer(ctx.me) !== undefined,
    text: ctx => {
      const card = drawTrainer(ctx.me) as TrainerCard;
      return `${card.name} is a Trainer card. It says: "${card.text}" Drag it from your hand onto the table to play it.`;
    },
    done: ctx => ctx.me.discard.cards.some(isTrainer),
    why: () => 'A Trainer does what its text says, then goes to your discard pile. Item cards like this one can '
      + 'be played as many times as you like in a turn; Supporters only once per turn.'
  },
  {
    id: 'attack',
    kind: 'do',
    section: 'energy',
    ready: ctx => onMyTurn(ctx) && payableAttacks(ctx.me.active).length > 0
      && ctx.opponent.active.getPokemonCard() !== undefined,
    text: ctx => {
      const attacks = payableAttacks(ctx.me.active);
      return `${activeName(ctx.me)} has enough Energy for ${attacks.join(' or ')}. Click ${activeName(ctx.me)}, `
        + `then click ${attacks[attacks.length - 1]} on its card. Attacking ends your turn, so attach Energy, Bench `
        + 'and play Trainers first.';
    },
    done: ctx => inPlay(ctx.opponent).some(slot => slot.damage > 0) || prizesTaken(ctx, ctx.me) > 0,
    why: ctx => {
      const hurt = inPlay(ctx.opponent).find(slot => slot.damage > 0);
      const pokemon = hurt ? hurt.getPokemonCard() : undefined;
      if (hurt === undefined || pokemon === undefined) {
        return 'Your attack ended your turn. Damage stays on a Pokémon until it is healed or Knocked Out.';
      }
      return `Your attack ended your turn. ${pokemon.name} now has ${hurt.damage} damage on it, `
        + `${Math.max(pokemon.hp - hurt.damage, 0)} HP left. Damage stays until it is healed or Knocked Out.`;
    }
  },
  {
    id: 'bot-turn',
    kind: 'read',
    section: 'turn',
    ready: ctx => !ctx.myTurn && ctx.state.phase === GamePhase.PLAYER_TURN && ctx.state.turn >= 2,
    text: () => 'Now it is the bot\'s turn. It follows the same rules you do. Each of its moves shows up in the '
      + 'game log below, with a "Why?" note that explains it. In this tutorial the bot waits for you: '
      + 'press Continue to see its next move.'
  },
  {
    id: 'evolve',
    kind: 'do',
    section: 'evolve',
    ready: ctx => onMyTurn(ctx) && evolution(ctx) !== undefined,
    text: ctx => {
      const evo = evolution(ctx) as { card: PokemonCard, base: PokemonCard };
      return `${evo.card.name} evolves from ${evo.base.name}. Drag ${evo.card.name} from your hand onto `
        + `${evo.base.name} to evolve it.`;
    },
    done: ctx => inPlay(ctx.me).some(slot => slot.isEvolved()),
    why: ctx => {
      const slot = inPlay(ctx.me).find(s => s.isEvolved()) as PokemonSlot;
      const pokemon = slot.getPokemonCard() as PokemonCard;
      const attacks = pokemon.attacks.map(a => `${a.name} needs ${a.cost.length} Energy`).join(', ');
      return `${pokemon.name} kept its Energy and damage, and has ${pokemon.hp} HP. It has new attacks now: `
        + `${attacks}. If it can't attack yet, keep attaching Energy and press End turn.`;
    }
  },
  {
    id: 'weakness',
    kind: 'read',
    section: 'damage',
    ready: ctx => onMyTurn(ctx) && ctx.state.turn >= 3
      && ctx.me.active.getPokemonCard() !== undefined && ctx.opponent.active.getPokemonCard() !== undefined,
    text: ctx => {
      const mine = ctx.me.active.getPokemonCard() as PokemonCard;
      const theirs = ctx.opponent.active.getPokemonCard() as PokemonCard;
      return 'Weakness is printed near the bottom of each Pokémon card. '
        + `Your ${weaknessText(mine)} The bot's ${weaknessText(theirs)} `
        + 'Attacks of other types do normal damage.';
    }
  },
  {
    id: 'retreat',
    kind: 'read',
    section: 'retreat',
    ready: ctx => onMyTurn(ctx) && ctx.state.turn >= 3 && ctx.me.bench.some(s => s.getPokemonCard() !== undefined)
      && ctx.me.active.getPokemonCard() !== undefined,
    text: ctx => {
      const active = ctx.me.active.getPokemonCard() as PokemonCard;
      const cost = active.retreat.length;
      const switchCard = ctx.me.hand.cards.find(card => isTrainer(card) && card.name === 'Switch');
      return `To swap your Active Pokémon with a Benched one, drag ${active.name} onto it. That is retreating: `
        + (cost === 0
          ? `${active.name} has no Retreat Cost, so it is free. `
          : `you discard ${cost} Energy from ${active.name} to pay its Retreat Cost. `)
        + 'You can retreat once per turn. '
        + (switchCard ? 'The Switch card in your hand swaps them without paying.' : '');
    }
  },
  {
    id: 'win',
    kind: 'read',
    section: 'goal',
    ready: ctx => onMyTurn(ctx) && ctx.state.turn >= 5,
    text: () => 'That is a whole turn: draw, attach one Energy, Bench and evolve, play Trainers, then attack. '
      + 'You win by taking all 6 Prizes, by Knocking Out the bot\'s last Pokémon in play, or if the bot has no '
      + 'card to draw at the start of its turn. The rest of this game plays normally, with the Tips panel '
      + 'still helping. Good luck!'
  }
];

export interface TutorialView {
  /** The lesson to show now, if any. */
  lesson?: { id: string, kind: TutorialLessonKind, text: string, section: string };
  /** Why the most recently finished "do" lesson mattered. */
  why?: { id: string, text: string, section: string };
  /** Every lesson is done. */
  finished: boolean;
  /**
   * It is the bot's turn and it is not waiting on the player for anything, so
   * in a tutorial game it is waiting for the player's Continue (the server's
   * BotPacer). False once the tutorial is finished: the bot plays on by itself.
   */
  botWaiting: boolean;
  done: number;
  total: number;
}

/**
 * Keeps track of one tutorial game. Lessons are worked out from the state on
 * every update; what this class remembers is only which lessons are finished,
 * because a finished lesson stays finished even if the board changes again.
 */
export class TutorialCoach {

  private finished = new Set<string>();
  private lastWhy: { id: string, text: string, section: string } | undefined;
  private seenState = false;

  constructor(private lessons: TutorialLesson[] = TUTORIAL_LESSONS) { }

  /** The player clicked "Got it" on a "read" lesson. */
  public acknowledge(id: string): void {
    const lesson = this.lessons.find(l => l.id === id);
    if (lesson !== undefined && lesson.kind === 'read') {
      this.finished.add(id);
    }
  }

  public update(state: State | undefined, clientId: number): TutorialView {
    const total = this.lessons.length;
    const empty: TutorialView = {
      finished: this.finished.size >= total, done: this.finished.size, total, botWaiting: false
    };
    if (state === undefined || !state.rules.tutorial || state.phase === GamePhase.FINISHED) {
      return empty;
    }
    const me = state.players.find(p => p.id === clientId);
    const opponent = state.players.find(p => p.id !== clientId);
    if (me === undefined || opponent === undefined) {
      return empty;
    }
    const active = state.players[state.activePlayer];
    const ctx: TutorialContext = { state, me, opponent, myTurn: active !== undefined && active.id === me.id };

    // A lesson done before the coach first saw the game (a page reload) is
    // finished quietly: its "why" would explain a move made long ago.
    const quiet = !this.seenState;
    this.seenState = true;

    for (const lesson of this.lessons) {
      if (this.finished.has(lesson.id) || lesson.kind !== 'do' || !lesson.done || !lesson.done(ctx)) {
        continue;
      }
      this.finished.add(lesson.id);
      if (!quiet && lesson.why) {
        this.lastWhy = { id: lesson.id, text: lesson.why(ctx), section: lesson.section };
      }
    }

    const current = this.lessons.find(l => !this.finished.has(l.id) && l.ready(ctx));
    const finishedAll = this.finished.size >= total;
    const myPrompt = state.prompts.some(p => p.playerId === me.id && p.result === undefined);
    const view: TutorialView = {
      finished: finishedAll,
      done: this.finished.size,
      total,
      why: this.lastWhy,
      botWaiting: !finishedAll && !ctx.myTurn && state.phase === GamePhase.PLAYER_TURN && !myPrompt
    };
    if (current !== undefined) {
      view.lesson = { id: current.id, kind: current.kind, text: current.text(ctx), section: current.section };
    }
    return view;
  }

}
