import { CardList, CardType, ConfirmPrompt, EnergyCard, GameMessage, GamePhase, Player, PokemonCard, PokemonSlot, Rules, Stage, State,
  TrainerCard, TrainerType } from '@ptcg/common';

import { TUTORIAL_LESSONS, TutorialCoach, payableAttacks } from './tutorial-coach';
import { RULES_SECTIONS } from '../../../rules/rules.component';

class TestPokemon extends PokemonCard {
  public set = 'TEST';
  public fullName: string;
  constructor(public name: string, stage = Stage.BASIC, evolvesFrom = '', hp = 50) {
    super();
    this.fullName = name + ' TEST';
    this.stage = stage;
    this.evolvesFrom = evolvesFrom;
    this.hp = hp;
    this.retreat = [CardType.COLORLESS];
  }
}

class TestEnergy extends EnergyCard {
  public set = 'TEST';
  public fullName: string;
  constructor(public name: string, type: CardType) {
    super();
    this.fullName = name + ' TEST';
    this.provides = [type];
  }
}

class TestTrainer extends TrainerCard {
  public set = 'TEST';
  public fullName: string;
  constructor(public name: string, public text: string) {
    super();
    this.fullName = name + ' TEST';
    this.trainerType = TrainerType.ITEM;
  }
}

function charmander(): TestPokemon {
  const card = new TestPokemon('Charmander');
  card.weakness = [{ type: CardType.WATER }];
  card.attacks = [
    { name: 'Scratch', cost: [CardType.COLORLESS], damage: '10', text: '' },
    { name: 'Ember', cost: [CardType.FIRE, CardType.COLORLESS], damage: '30', text: '' }
  ];
  return card;
}

function charmeleon(): TestPokemon {
  const card = new TestPokemon('Charmeleon', Stage.STAGE_1, 'Charmander', 80);
  card.weakness = [{ type: CardType.WATER }];
  card.attacks = [
    { name: 'Slash', cost: [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS], damage: '30', text: '' }
  ];
  return card;
}

function pikachu(): TestPokemon {
  const card = new TestPokemon('Pikachu', Stage.BASIC, '', 40);
  card.weakness = [{ type: CardType.FIGHTING }];
  card.attacks = [{ name: 'Gnaw', cost: [CardType.COLORLESS], damage: '10', text: '' }];
  return card;
}

function fire(): TestEnergy {
  return new TestEnergy('Fire Energy', CardType.FIRE);
}

function bill(): TestTrainer {
  return new TestTrainer('Bill', 'Draw 2 cards.');
}

describe('TutorialCoach (learn mode)', () => {
  const myId = 1;
  const botId = 2;
  let state: State;
  let me: Player;
  let bot: Player;
  let coach: TutorialCoach;

  function slotWith(card: PokemonCard, playedTurn = 0): PokemonSlot {
    const slot = new PokemonSlot();
    slot.pokemons.cards.push(card);
    slot.pokemonPlayedTurn = playedTurn;
    return slot;
  }

  function dealPrizes(player: Player, left = 6): void {
    player.prizes = [];
    for (let i = 0; i < 6; i++) {
      const prize = new CardList();
      if (i < left) {
        prize.cards.push(fire());
      }
      player.prizes.push(prize);
    }
  }

  function startTurn(turn: number, mine: boolean): void {
    state.turn = turn;
    state.activePlayer = mine ? 0 : 1;
    state.phase = GamePhase.PLAYER_TURN;
  }

  function lessonId(): string | undefined {
    const view = coach.update(state, myId);
    return view.lesson ? view.lesson.id : undefined;
  }

  beforeEach(() => {
    state = new State();
    state.rules = new Rules({ tutorial: true });
    me = new Player();
    me.id = myId;
    bot = new Player();
    bot.id = botId;
    for (let i = 0; i < 4; i++) {
      me.bench.push(new PokemonSlot());
      bot.bench.push(new PokemonSlot());
    }
    state.players = [me, bot];
    state.phase = GamePhase.SETUP;
    me.hand.cards = [charmander(), fire(), new TestPokemon('Growlithe'), bill()];
    coach = new TutorialCoach();
  });

  it('links every lesson to a section of the rules page', () => {
    const sections = RULES_SECTIONS.map(s => s.id);
    TUTORIAL_LESSONS.forEach(lesson => expect(sections).toContain(lesson.section));
  });

  it('shows nothing outside a tutorial game, to spectators, or once the game is over', () => {
    expect(coach.update(undefined, myId).lesson).toBeUndefined();
    expect(coach.update(state, 99).lesson).toBeUndefined();
    state.rules = new Rules();
    expect(coach.update(state, myId).lesson).toBeUndefined();
    state.rules = new Rules({ tutorial: true });
    state.phase = GamePhase.FINISHED;
    expect(coach.update(state, myId).lesson).toBeUndefined();
  });

  it('walks the first turn: setup, energy, bench, trainer, attack, each followed by why', () => {
    // Setup: choose the Active Pokemon, named from the hand.
    let view = coach.update(state, myId);
    expect(view.lesson && view.lesson.id).toBe('setup');
    expect(view.lesson && view.lesson.text).toContain('Choose Charmander as your Active Pokémon');
    expect(view.why).toBeUndefined();

    // The player put Charmander up; Prizes are dealt; turn 1 is theirs.
    me.hand.cards = [fire(), new TestPokemon('Growlithe'), bill()];
    me.active = slotWith(charmander(), 1);
    bot.active = slotWith(pikachu(), 1);
    dealPrizes(me);
    dealPrizes(bot);
    startTurn(1, true);
    view = coach.update(state, myId);
    expect(view.why && view.why.id).toBe('setup');
    expect(view.why && view.why.text).toContain('6 Prize cards');
    expect(view.lesson && view.lesson.id).toBe('energy');
    expect(view.lesson && view.lesson.text).toBe('Drag Fire Energy from your hand onto Charmander.');

    // Attach.
    me.active.energies.cards.push(me.hand.cards.shift() as EnergyCard);
    view = coach.update(state, myId);
    expect(view.why && view.why.id).toBe('energy');
    expect(view.why && view.why.text).toContain('Scratch needs 1, Ember needs 2');
    expect(view.lesson && view.lesson.id).toBe('bench');
    expect(view.lesson && view.lesson.text).toContain('Drag Growlithe');

    // Bench.
    me.bench[0] = slotWith(me.hand.cards.shift() as PokemonCard, 1);
    view = coach.update(state, myId);
    expect(view.why && view.why.id).toBe('bench');
    expect(view.lesson && view.lesson.id).toBe('trainer');
    expect(view.lesson && view.lesson.text).toContain('Bill is a Trainer card. It says: "Draw 2 cards."');

    // Play Bill.
    me.discard.cards.push(me.hand.cards.shift() as TrainerCard);
    view = coach.update(state, myId);
    expect(view.why && view.why.id).toBe('trainer');
    expect(view.lesson && view.lesson.id).toBe('attack');
    expect(view.lesson && view.lesson.text).toContain('Charmander has enough Energy for Scratch');

    // Attack: Pikachu takes 10.
    bot.active.damage = 10;
    startTurn(2, false);
    view = coach.update(state, myId);
    expect(view.why && view.why.id).toBe('attack');
    expect(view.why && view.why.text).toContain('Pikachu now has 10 damage on it, 30 HP left');
    expect(view.lesson && view.lesson.id).toBe('bot-turn');
    expect(view.lesson && view.lesson.kind).toBe('read');
  });

  it('waits for "Got it" on a read lesson, then moves on', () => {
    me.active = slotWith(charmander(), 1);
    bot.active = slotWith(pikachu(), 1);
    dealPrizes(me);
    dealPrizes(bot);
    me.hand.cards = [];
    startTurn(2, false);
    expect(lessonId()).toBe('bot-turn');
    expect(lessonId()).toBe('bot-turn');
    coach.acknowledge('bot-turn');
    expect(lessonId()).toBeUndefined();
  });

  it('teaches evolving only once the Basic has been in play since an earlier turn', () => {
    me.active = slotWith(charmander(), 1);
    me.active.energies.cards.push(fire());
    bot.active = slotWith(pikachu(), 1);
    dealPrizes(me);
    dealPrizes(bot);
    me.hand.cards = [charmeleon()];
    startTurn(1, true);
    coach.update(state, myId);
    expect(TUTORIAL_LESSONS.find(l => l.id === 'evolve')?.ready({
      state, me, opponent: bot, myTurn: true
    })).toBeFalse();

    startTurn(3, true);
    let view = coach.update(state, myId);
    // Attack comes before evolve in the script, and Scratch is payable.
    expect(view.lesson && view.lesson.id).toBe('attack');
    bot.active.damage = 10;
    view = coach.update(state, myId);
    expect(view.lesson && view.lesson.id).toBe('evolve');
    expect(view.lesson && view.lesson.text).toBe(
      'Charmeleon evolves from Charmander. Drag Charmeleon from your hand onto Charmander to evolve it.');

    me.active.pokemons.cards.push(me.hand.cards.shift() as PokemonCard);
    view = coach.update(state, myId);
    expect(view.why && view.why.id).toBe('evolve');
    expect(view.why && view.why.text).toContain('Charmeleon kept its Energy and damage, and has 80 HP');
    expect(view.why && view.why.text).toContain('Slash needs 3 Energy');
  });

  it('builds the Weakness lesson from both Active Pokemon', () => {
    me.active = slotWith(charmeleon(), 1);
    bot.active = slotWith(pikachu(), 1);
    dealPrizes(me);
    dealPrizes(bot);
    startTurn(3, true);
    const weakness = TUTORIAL_LESSONS.find(l => l.id === 'weakness');
    const text = weakness ? weakness.text({ state, me, opponent: bot, myTurn: true }) : '';
    expect(text).toContain('Your Charmeleon is weak to Water: Water attacks do double damage to it.');
    expect(text).toContain('The bot\'s Pikachu is weak to Fighting');
  });

  it('counts a lesson done out of order and does not hold up the next one', () => {
    // Growlithe went to the Bench during setup, before the bench lesson.
    me.active = slotWith(charmander(), 1);
    me.bench[0] = slotWith(new TestPokemon('Growlithe'), 1);
    bot.active = slotWith(pikachu(), 1);
    dealPrizes(me);
    dealPrizes(bot);
    me.hand.cards = [fire(), bill()];
    state.phase = GamePhase.SETUP;
    coach.update(state, myId);
    startTurn(1, true);
    expect(lessonId()).toBe('energy');
    me.active.energies.cards.push(me.hand.cards.shift() as EnergyCard);
    // Straight to the trainer lesson: the bench lesson is already done.
    expect(lessonId()).toBe('trainer');
  });

  it('finishes quietly what was done before the coach first saw the game', () => {
    me.active = slotWith(charmander(), 1);
    me.active.energies.cards.push(fire());
    bot.active = slotWith(pikachu(), 1);
    dealPrizes(me);
    dealPrizes(bot);
    startTurn(1, true);
    const view = coach.update(state, myId);
    expect(view.why).toBeUndefined();
    expect(view.lesson && view.lesson.id).not.toBe('energy');
  });

  it('tells the player when either side takes a Prize, not before the Prizes are dealt', () => {
    me.active = slotWith(charmander(), 1);
    bot.active = slotWith(pikachu(), 1);
    me.hand.cards = [];
    state.phase = GamePhase.SETUP;
    expect(lessonId()).toBe('setup');

    dealPrizes(me, 5);
    dealPrizes(bot);
    startTurn(3, true);
    const view = coach.update(state, myId);
    expect(view.lesson && view.lesson.id).toBe('took-prize');
    expect(view.lesson && view.lesson.text).toContain('5 more and you win');
    coach.acknowledge('took-prize');

    dealPrizes(bot, 5);
    expect(lessonId()).toBe('lost-prize');
  });

  it('reports progress and finishes once every lesson is done', () => {
    me.active = slotWith(charmander(), 1);
    bot.active = slotWith(pikachu(), 1);
    dealPrizes(me);
    dealPrizes(bot);
    startTurn(5, true);
    let view = coach.update(state, myId);
    expect(view.total).toBe(TUTORIAL_LESSONS.length);
    expect(view.finished).toBeFalse();

    // Mark every lesson done the way the player would.
    TUTORIAL_LESSONS.filter(l => l.kind === 'read').forEach(l => coach.acknowledge(l.id));
    me.bench[0] = slotWith(new TestPokemon('Growlithe'), 1);
    me.active.energies.cards.push(fire());
    me.active.pokemons.cards.push(charmeleon());
    me.discard.cards.push(bill());
    bot.active.damage = 10;
    view = coach.update(state, myId);
    // Setup is a "do" lesson that is done as soon as the game is past setup.
    expect(view.done).toBe(TUTORIAL_LESSONS.length);
    expect(view.finished).toBeTrue();
    expect(view.lesson).toBeUndefined();
  });

  it('says the bot is waiting for Continue only on its turn, and not while it waits on the player', () => {
    me.active = slotWith(charmander(), 1);
    bot.active = slotWith(pikachu(), 1);
    dealPrizes(me);
    dealPrizes(bot);
    expect(coach.update(state, myId).botWaiting).toBeFalse(); // setup

    startTurn(2, true);
    expect(coach.update(state, myId).botWaiting).toBeFalse();

    startTurn(2, false);
    expect(coach.update(state, myId).botWaiting).toBeTrue();

    // The bot Knocked Out the player's Active: the player must choose first.
    const prompt = new ConfirmPrompt(myId, GameMessage.CHOOSE_STARTING_POKEMONS);
    state.prompts = [prompt];
    expect(coach.update(state, myId).botWaiting).toBeFalse();
    prompt.result = true;
    expect(coach.update(state, myId).botWaiting).toBeTrue();

    // The bot's own prompts don't hold it back from waiting for Continue.
    state.prompts = [new ConfirmPrompt(botId, GameMessage.CHOOSE_STARTING_POKEMONS)];
    expect(coach.update(state, myId).botWaiting).toBeTrue();
  });

  it('stops saying the bot waits once the tutorial is finished', () => {
    const empty = new TutorialCoach([]);
    startTurn(2, false);
    const view = empty.update(state, myId);
    expect(view.finished).toBeTrue();
    expect(view.botWaiting).toBeFalse();
  });

  it('ignores "Got it" for a lesson that must be done on the board', () => {
    coach.acknowledge('energy');
    me.active = slotWith(charmander(), 1);
    bot.active = slotWith(pikachu(), 1);
    dealPrizes(me);
    dealPrizes(bot);
    me.hand.cards = [fire()];
    startTurn(1, true);
    expect(lessonId()).toBe('energy');
  });

  it('works out which attacks the Energy pays for', () => {
    const slot = slotWith(charmander(), 1);
    expect(payableAttacks(slot)).toEqual([]);
    slot.energies.cards.push(fire());
    expect(payableAttacks(slot)).toEqual(['Scratch']);
    slot.energies.cards.push(new TestEnergy('Water Energy', CardType.WATER));
    expect(payableAttacks(slot)).toEqual(['Scratch', 'Ember']);
  });
});
