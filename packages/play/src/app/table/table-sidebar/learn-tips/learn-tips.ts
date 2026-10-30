import { Card, EnergyCard, GamePhase, Player, PokemonCard, SpecialCondition, Stage, State, SuperType,
  TrainerCard, TrainerType } from '@ptcg/common';

/**
 * Learn mode: a short tip about the situation at the table, with a link to the
 * matching section of the "How to play" page (/rules#<section>).
 *
 * Tips are derived only from the game state the player can already see (their own
 * hand and the board), and each one restates a rule the engine enforces, as written
 * on the rules page. They never suggest a specific play; the bot's "Why?" notes do
 * that for the bot's own moves.
 */
export interface LearnTip {
  /** Stable id, used to track tips in the template and in specs. */
  id: string;
  text: string;
  /** Section id on the rules page, see RulesComponent.sections. */
  section: string;
}

export const MAX_LEARN_TIPS = 2;

const CONDITION_TEXT: { [condition: number]: string } = {
  [SpecialCondition.POISONED]: 'Poisoned: it takes 10 damage between turns.',
  [SpecialCondition.BURNED]: 'Burned: between turns, flip a coin. If tails, it takes 20 damage.',
  [SpecialCondition.ASLEEP]: 'Asleep: it can\'t attack or retreat. Between turns, flip a coin to wake it up.',
  [SpecialCondition.PARALYZED]: 'Paralyzed: it can\'t attack or retreat until the end of your next turn.',
  [SpecialCondition.CONFUSED]: 'Confused: when it attacks, flip a coin. If tails, it hurts itself instead.',
};

function isPokemon(card: Card): card is PokemonCard {
  return card.superType === SuperType.POKEMON;
}

function isEnergy(card: Card): card is EnergyCard {
  return card.superType === SuperType.ENERGY;
}

function isTrainer(card: Card): card is TrainerCard {
  return card.superType === SuperType.TRAINER;
}

function conditionTips(player: Player): LearnTip[] {
  const active = player.active.getPokemonCard();
  if (active === undefined) {
    return [];
  }
  const texts = player.active.specialConditions
    .map(condition => CONDITION_TEXT[condition])
    .filter(text => text !== undefined);
  if (texts.length === 0) {
    return [];
  }
  const conditions = player.active.specialConditions;
  const cantRetreat = conditions.includes(SpecialCondition.ASLEEP) || conditions.includes(SpecialCondition.PARALYZED);
  const cure = cantRetreat
    ? 'Evolving it cures it.'
    : 'Retreating or evolving it cures it.';
  return [{
    id: 'conditions',
    text: `Your ${active.name} is ${texts.join(' It is also ')} ${cure}`,
    section: 'conditions'
  }];
}

function benchTip(player: Player): LearnTip[] {
  const hasBench = player.bench.some(slot => slot.getPokemonCard() !== undefined);
  const basic = player.hand.cards.find(card => isPokemon(card) && card.stage === Stage.BASIC);
  if (hasBench || basic === undefined) {
    return [];
  }
  return [{
    id: 'bench',
    text: `Your Bench is empty. If your Active Pokémon is Knocked Out with nothing on the Bench, you lose. `
      + `You can put ${basic.name} from your hand onto your Bench.`,
    section: 'tips'
  }];
}

function evolveTip(state: State, player: Player): LearnTip[] {
  const inPlay: { name: string, playedTurn: number }[] = [];
  [player.active, ...player.bench].forEach(slot => {
    const pokemon = slot.getPokemonCard();
    if (pokemon !== undefined) {
      inPlay.push({ name: pokemon.name, playedTurn: slot.pokemonPlayedTurn });
    }
  });

  for (const card of player.hand.cards) {
    if (!isPokemon(card) || card.stage === Stage.BASIC || !card.evolvesFrom) {
      continue;
    }
    const base = inPlay.find(p => p.name === card.evolvesFrom);
    if (base === undefined) {
      continue;
    }
    // Same check as the engine (play-pokemon-effect): no evolving on the turn it came into play.
    const ready = base.playedTurn < state.turn;
    return [{
      id: 'evolve',
      text: ready
        ? `${card.name} in your hand evolves from your ${base.name}. Evolving keeps its Energy and damage.`
        : `${card.name} in your hand evolves from your ${base.name}, but not this turn: `
          + `a Pokémon can't evolve on the turn it came into play.`,
      section: 'evolve'
    }];
  }
  return [];
}

function energyTip(state: State, player: Player): LearnTip[] {
  if (player.energyPlayedTurn === state.turn) {
    return [];
  }
  const energy = player.hand.cards.find(card => isEnergy(card));
  if (energy === undefined) {
    return [];
  }
  return [{
    id: 'energy',
    text: `You haven't attached an Energy this turn. You can attach one Energy card from your hand, `
      + `like ${energy.name}, to one of your Pokémon.`,
    section: 'energy'
  }];
}

function trainerTip(player: Player): LearnTip[] {
  const trainers = player.hand.cards.filter(card => isTrainer(card));
  if (trainers.length === 0) {
    return [];
  }
  const hasSupporter = trainers.some(card => isTrainer(card) && card.trainerType === TrainerType.SUPPORTER);
  return [{
    id: 'trainers',
    text: hasSupporter
      ? 'You have Trainer cards in your hand. Items can be played as often as you like, but only one Supporter per turn.'
      : 'You have Trainer cards in your hand. Read them: they draw cards, search your deck and heal.',
    section: 'trainers'
  }];
}

function attackLastTip(): LearnTip {
  return {
    id: 'turn',
    text: 'Attacking ends your turn, so attach Energy, evolve and play Trainers first.',
    section: 'turn'
  };
}

/**
 * Tips for the player with the given client id, most relevant first, at most MAX_LEARN_TIPS.
 * Spectators, replays and finished games get no tips.
 */
export function getLearnTips(state: State | undefined, clientId: number): LearnTip[] {
  if (state === undefined) {
    return [];
  }
  const player = state.players.find(p => p.id === clientId);
  if (player === undefined) {
    return [];
  }

  if (state.phase === GamePhase.SETUP) {
    return [{
      id: 'setup',
      text: 'Choose a Basic Pokémon as your Active Pokémon. You may also put up to 5 more Basic Pokémon on your Bench.',
      section: 'setup'
    }];
  }

  if (state.phase !== GamePhase.PLAYER_TURN && state.phase !== GamePhase.ATTACK
    && state.phase !== GamePhase.BETWEEN_TURNS) {
    return [];
  }

  const activePlayer = state.players[state.activePlayer];
  const myTurn = activePlayer !== undefined && activePlayer.id === player.id;

  let tips: LearnTip[];
  if (myTurn && state.phase === GamePhase.PLAYER_TURN) {
    tips = [
      ...conditionTips(player),
      ...benchTip(player),
      ...evolveTip(state, player),
      ...energyTip(state, player),
      ...trainerTip(player),
      attackLastTip()
    ];
  } else {
    // Still the player's turn during ATTACK and BETWEEN_TURNS, when an attack can
    // be prompting them to choose a target or discard. Saying it is the opponent's
    // turn there would be wrong exactly when they are being asked to act.
    tips = [...conditionTips(player)];
    if (!myTurn) {
      tips.push({
        id: 'opponent-turn',
        text: 'It\'s your opponent\'s turn. Follow it in the game log below.',
        section: 'turn'
      });
    }
  }
  return tips.slice(0, MAX_LEARN_TIPS);
}
