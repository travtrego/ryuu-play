import { CardList, CardType, EnergyCard, GamePhase, GameWinner, Player, PokemonCard, PokemonSlot,
  SpecialCondition, State, TrainerCard } from '@ptcg/common';

import { buildClaudeSnapshot, groupCardNames, SNAPSHOT_LOG_LINES } from './claude-snapshot';

class TestPokemon extends PokemonCard {
  public name: string;
  public fullName: string;
  public set = 'TST';
  constructor(name: string, hp: number, types: CardType[] = [CardType.DARK]) {
    super();
    this.name = name;
    this.fullName = name + ' TST';
    this.hp = hp;
    this.cardTypes = types;
  }
}

class TestEnergy extends EnergyCard {
  public name: string;
  public fullName: string;
  public set = 'TST';
  constructor(name: string) {
    super();
    this.name = name;
    this.fullName = name + ' TST';
  }
}

class TestTrainer extends TrainerCard {
  public name: string;
  public fullName: string;
  public set = 'TST';
  constructor(name: string) {
    super();
    this.name = name;
    this.fullName = name + ' TST';
  }
}

describe('buildClaudeSnapshot (learn mode)', () => {
  const myId = 1;
  const botId = 2;
  let state: State;
  let me: Player;
  let bot: Player;

  function slot(card: PokemonCard, damage = 0): PokemonSlot {
    const s = new PokemonSlot();
    s.pokemons.cards = [card];
    s.damage = damage;
    return s;
  }

  function prizes(left: number): CardList[] {
    const lists: CardList[] = [];
    for (let i = 0; i < 6; i++) {
      const list = new CardList();
      if (i < left) {
        list.cards.push(new TestTrainer('Secret Prize'));
      }
      lists.push(list);
    }
    return lists;
  }

  beforeEach(() => {
    state = new State();
    state.phase = GamePhase.PLAYER_TURN;
    state.turn = 5;
    state.rules.formatName = 'Modern Standard';
    me = new Player();
    me.id = myId;
    me.name = 'Ash';
    me.prizes = prizes(4);
    me.hand.cards = [new TestTrainer('Rare Candy'), new TestTrainer('Rare Candy'), new TestTrainer('Iono')];
    me.active = slot(new TestPokemon('Dreepy', 70, [CardType.DRAGON]), 30);
    me.active.energies.cards = [new TestEnergy('Fire Energy')];
    me.active.specialConditions = [SpecialCondition.POISONED];
    me.bench = [slot(new TestPokemon('Duskull', 60, [CardType.PSYCHIC])), new PokemonSlot()];
    bot = new Player();
    bot.id = botId;
    bot.name = 'Bot';
    bot.prizes = prizes(6);
    bot.hand.cards = [new TestTrainer('Bot Secret Card')];
    bot.deck.cards = [new TestTrainer('Bot Deck Card')];
    bot.active = slot(new TestPokemon('Munkidori', 110));
    bot.stadium.cards = [new TestTrainer('Area Zero Underdepths')];
    state.players = [me, bot];
    state.activePlayer = 0;
  });

  it('should group card names', () => {
    expect(groupCardNames(['A', 'B', 'A'])).toEqual('2x A, B');
    expect(groupCardNames([])).toEqual('none');
  });

  it('should describe both boards and my hand', () => {
    const text = buildClaudeSnapshot(state, myId, []);
    expect(text).toContain('Format: Modern Standard. Turn 5.');
    expect(text).toContain('It is Ash\'s turn (mine).');
    expect(text).toContain('- Hand: 2x Rare Candy TST, Iono TST');
    expect(text).toContain('- Active: Dreepy TST (Dragon); HP 40/70; Energy: Fire Energy TST; Poisoned');
    expect(text).toContain('  - Duskull TST (Psychic); HP 60/60; Energy: none');
    expect(text).toContain('Prize cards left: 4');
    expect(text).toContain('- Active: Munkidori TST (Darkness); HP 110/110');
    expect(text).toContain('Stadium in play: Area Zero Underdepths');
    expect(text.trim().endsWith('My question:')).toBe(true);
  });

  it('should never name hidden cards', () => {
    const text = buildClaudeSnapshot(state, myId, []);
    expect(text).not.toContain('Bot Secret Card');
    expect(text).not.toContain('Bot Deck Card');
    expect(text).not.toContain('Secret Prize');
    expect(text).toContain('hand: 1 cards');
  });

  it('should show no hand to a spectator', () => {
    const text = buildClaudeSnapshot(state, 99, []);
    expect(text).not.toContain('Rare Candy');
    expect(text).not.toContain('Bot Secret Card');
  });

  it('should keep only the last log lines', () => {
    const lines: string[] = [];
    for (let i = 0; i < SNAPSHOT_LOG_LINES + 5; i++) {
      lines.push('line ' + i);
    }
    const text = buildClaudeSnapshot(state, myId, lines);
    expect(text).not.toContain('- line 4\n');
    expect(text).toContain('- line 5\n');
    expect(text).toContain(`- line ${SNAPSHOT_LOG_LINES + 4}`);
  });

  it('should say who won a finished game', () => {
    state.phase = GamePhase.FINISHED;
    state.winner = GameWinner.PLAYER_2;
    const text = buildClaudeSnapshot(state, myId, []);
    expect(text).toContain('The game is over: Bot won.');
    expect(text).not.toContain('turn (mine)');
  });
});
