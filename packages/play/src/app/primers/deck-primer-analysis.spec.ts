import { Card, CardTag, CardType, EnergyCard, MODERN_DECKS, ModernDeck, PokemonCard, PowerType, Stage,
  TrainerCard, TrainerType } from '@ptcg/common';

import { analyseDeck, prizeValue } from './deck-primer-analysis';
import { DECK_PRIMERS } from './deck-primers';

class TestPokemon extends PokemonCard {
  public set = 'TST';
  public fullName: string;
  constructor(public name: string, stage = Stage.BASIC, evolvesFrom = '', tags: CardTag[] = []) {
    super();
    this.fullName = name + ' TST';
    this.stage = stage;
    this.evolvesFrom = evolvesFrom;
    this.tags = tags;
    this.hp = 70;
  }
}

class TestEnergy extends EnergyCard {
  public set = 'TST';
  public fullName: string;
  constructor(public name: string) {
    super();
    this.fullName = name + ' TST';
  }
}

class TestTrainer extends TrainerCard {
  public set = 'TST';
  public fullName: string;
  constructor(public name: string, trainerType: TrainerType) {
    super();
    this.fullName = name + ' TST';
    this.trainerType = trainerType;
  }
}

describe('analyseDeck (deck primers)', () => {
  const dreepy = new TestPokemon('Dreepy');
  const drakloak = new TestPokemon('Drakloak', Stage.STAGE_1, 'Dreepy');
  const dragapult = new TestPokemon('Dragapult ex', Stage.STAGE_2, 'Drakloak', [CardTag.POKEMON_EX, CardTag.TERA]);
  dragapult.weakness = [];
  dragapult.retreat = [CardType.COLORLESS];
  dragapult.powers = [];
  dragapult.attacks = [
    { name: 'Jet Headbutt', cost: [CardType.COLORLESS], damage: '70', text: '' },
    { name: 'Phantom Dive', cost: [CardType.FIRE, CardType.PSYCHIC], damage: '200', text: '' }
  ];
  const riolu1 = new TestPokemon('Riolu');
  const riolu2 = new TestPokemon('Riolu');
  riolu2.fullName = 'Riolu TST2';
  const lucario = new TestPokemon('Mega Lucario ex', Stage.STAGE_1, 'Riolu',
    [CardTag.POKEMON_EX, CardTag.MEGA_EVOLUTION_EX]);
  lucario.weakness = [{ type: CardType.PSYCHIC }];
  lucario.powers = [{ name: 'Test Ability', powerType: PowerType.ABILITY, text: '' }];
  lucario.attacks = [
    { name: 'Spread', cost: [], damage: '60×', text: '' },
    { name: 'Effect only', cost: [CardType.FIGHTING], damage: '', text: '' }
  ];
  const lonely = new TestPokemon('Kadabra', Stage.STAGE_1, 'Abra');
  const ball = new TestTrainer('Ultra Ball', TrainerType.ITEM);
  const boss = new TestTrainer('Boss\'s Orders', TrainerType.SUPPORTER);
  const stadium = new TestTrainer('Gym', TrainerType.STADIUM);
  const fire = new TestEnergy('Fire Energy');

  const cards: Card[] = [dreepy, drakloak, dragapult, riolu1, riolu2, lucario, lonely, ball, boss, stadium, fire];
  const lookup = (name: string) => cards.find(c => c.fullName === name);

  const deck: ModernDeck = {
    id: 'test',
    name: 'Test',
    source: '',
    cards: [
      ['Dreepy TST', 4], ['Drakloak TST', 4], ['Dragapult ex TST', 3],
      ['Riolu TST', 3], ['Riolu TST2', 1], ['Mega Lucario ex TST', 2],
      ['Kadabra TST', 1],
      ['Ultra Ball TST', 4], ['Boss\'s Orders TST', 3], ['Gym TST', 2],
      ['Fire Energy TST', 33], ['Missing Card XYZ', 0]
    ]
  };

  it('groups Pokémon into evolution lines by evolvesFrom', () => {
    const analysis = analyseDeck(deck, lookup);
    const lines = analysis.lines.map(line => line.steps.map(step => step.map(p => p.count + ' ' + p.name).join(' + ')));
    expect(lines).toEqual([
      ['4 Dreepy', '4 Drakloak', '3 Dragapult ex'],
      ['3 Riolu + 1 Riolu', '2 Mega Lucario ex'],
      ['1 Kadabra'],
    ]);
    expect(analysis.lines[0].missingEvolvesFrom).toBeUndefined();
    expect(analysis.lines[2].missingEvolvesFrom).toBe('Abra');
  });

  it('counts Prize cards the way the engine does', () => {
    expect(prizeValue(dreepy)).toBe(1);
    expect(prizeValue(dragapult)).toBe(2);
    expect(prizeValue(lucario)).toBe(3);
    const analysis = analyseDeck(deck, lookup);
    expect(analysis.exCount).toBe(3);
    expect(analysis.megaExCount).toBe(2);
  });

  it('summarises the deck make-up', () => {
    const analysis = analyseDeck(deck, lookup);
    expect(analysis.pokemonCount).toBe(18);
    expect(analysis.trainerCount).toBe(9);
    expect(analysis.energyCount).toBe(33);
    expect(analysis.trainerKinds).toEqual([
      { label: 'Supporters', count: 3 },
      { label: 'Items', count: 4 },
      { label: 'Stadiums', count: 2 },
    ]);
    expect(analysis.energies).toEqual([{ label: 'Fire Energy', count: 33 }]);
    expect(analysis.unknown).toEqual(['Missing Card XYZ']);
  });

  it('lists stage, Weakness, Retreat, Abilities and attacks', () => {
    const analysis = analyseDeck(deck, lookup);
    const pult = analysis.lines[0].steps[2][0];
    expect(pult.stage).toBe('Stage 2');
    expect(pult.weakness).toBe('');
    expect(pult.retreat).toBe(1);
    expect(pult.attacks).toEqual([
      { name: 'Jet Headbutt', cost: ['Colorless'], damage: '70' },
      { name: 'Phantom Dive', cost: ['Fire', 'Psychic'], damage: '200' },
    ]);
    const mega = analysis.lines[1].steps[1][0];
    expect(mega.weakness).toBe('Psychic');
    expect(mega.abilities).toEqual(['Test Ability']);
    expect(mega.attacks.map(a => a.damage)).toEqual(['60×', '']);
  });
});

describe('DECK_PRIMERS', () => {
  it('only has primers for decks in MODERN_DECKS', () => {
    const ids = MODERN_DECKS.map(d => d.id);
    Object.keys(DECK_PRIMERS).forEach(id => expect(ids).withContext(id).toContain(id));
  });

  it('has a primer with a plan and tips for every modern deck', () => {
    for (const deck of MODERN_DECKS) {
      const text = DECK_PRIMERS[deck.id];
      expect(text).withContext(deck.id).toBeDefined();
      expect(text.plan.length).withContext(deck.id).toBeGreaterThan(40);
      expect(text.tips.length).withContext(deck.id).toBeGreaterThan(0);
    }
  });
});
