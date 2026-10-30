import { CardType, EnergyCard, GamePhase, Player, PokemonCard, PokemonSlot, SpecialCondition, Stage, State,
  TrainerCard, TrainerType } from '@ptcg/common';

import { getLearnTips, MAX_LEARN_TIPS } from './learn-tips';
import { RULES_SECTIONS } from '../../../rules/rules.component';

class TestPokemon extends PokemonCard {
  public set = 'TEST';
  public fullName: string;
  constructor(public name: string, stage = Stage.BASIC, evolvesFrom = '') {
    super();
    this.fullName = name + ' TEST';
    this.stage = stage;
    this.evolvesFrom = evolvesFrom;
  }
}

class TestEnergy extends EnergyCard {
  public set = 'TEST';
  public name = 'Fire Energy';
  public fullName = 'Fire Energy TEST';
  public provides = [CardType.FIRE];
}

class TestTrainer extends TrainerCard {
  public set = 'TEST';
  public fullName: string;
  constructor(public name: string, trainerType: TrainerType) {
    super();
    this.fullName = name + ' TEST';
    this.trainerType = trainerType;
  }
}

describe('getLearnTips (learn mode)', () => {
  const myId = 1;
  const botId = 2;
  let state: State;
  let me: Player;
  let bot: Player;

  function slotWith(card: PokemonCard, playedTurn = 1): PokemonSlot {
    const slot = new PokemonSlot();
    slot.pokemons.cards.push(card);
    slot.pokemonPlayedTurn = playedTurn;
    return slot;
  }

  function ids(): string[] {
    return getLearnTips(state, myId).map(tip => tip.id);
  }

  beforeEach(() => {
    state = new State();
    me = new Player();
    me.id = myId;
    bot = new Player();
    bot.id = botId;
    state.players = [me, bot];
    state.activePlayer = 0;
    state.turn = 3;
    state.phase = GamePhase.PLAYER_TURN;
    me.active = slotWith(new TestPokemon('Charmander'));
    me.bench = [slotWith(new TestPokemon('Vulpix'))];
  });

  it('gives no tips to spectators or before the game starts', () => {
    expect(getLearnTips(state, 99)).toEqual([]);
    expect(getLearnTips(undefined, myId)).toEqual([]);
    state.phase = GamePhase.WAITING_FOR_PLAYERS;
    expect(ids()).toEqual([]);
    state.phase = GamePhase.FINISHED;
    expect(ids()).toEqual([]);
  });

  it('explains setup during the setup phase', () => {
    state.phase = GamePhase.SETUP;
    const tips = getLearnTips(state, myId);
    expect(tips.map(t => t.id)).toEqual(['setup']);
    expect(tips[0].section).toBe('setup');
  });

  it('falls back to "attack last" on a quiet turn', () => {
    expect(ids()).toEqual(['turn']);
  });

  it('points out the Energy attachment until one is played this turn', () => {
    me.hand.cards.push(new TestEnergy());
    const tips = getLearnTips(state, myId);
    expect(tips[0].id).toBe('energy');
    expect(tips[0].text).toContain('Fire Energy');
    expect(tips[0].section).toBe('energy');

    me.energyPlayedTurn = state.turn;
    expect(ids()).not.toContain('energy');
  });

  it('names an evolution that is possible this turn', () => {
    me.hand.cards.push(new TestPokemon('Charmeleon', Stage.STAGE_1, 'Charmander'));
    const tips = getLearnTips(state, myId);
    expect(tips[0].id).toBe('evolve');
    expect(tips[0].text).toContain('Charmeleon in your hand evolves from your Charmander.');
  });

  it('says why a Pokemon played this turn cannot evolve yet, using the engine rule', () => {
    me.active = slotWith(new TestPokemon('Charmander'), state.turn);
    me.hand.cards.push(new TestPokemon('Charmeleon', Stage.STAGE_1, 'Charmander'));
    const tips = getLearnTips(state, myId);
    expect(tips[0].id).toBe('evolve');
    expect(tips[0].text).toContain('but not this turn');
  });

  it('ignores evolutions of Pokemon that are not in play', () => {
    me.hand.cards.push(new TestPokemon('Wartortle', Stage.STAGE_1, 'Squirtle'));
    expect(ids()).not.toContain('evolve');
  });

  it('warns about an empty Bench when a Basic Pokemon is in hand', () => {
    me.bench = [];
    me.hand.cards.push(new TestPokemon('Growlithe'));
    const tips = getLearnTips(state, myId);
    expect(tips[0].id).toBe('bench');
    expect(tips[0].text).toContain('Growlithe');

    me.bench = [slotWith(new TestPokemon('Vulpix'))];
    expect(ids()).not.toContain('bench');
  });

  it('mentions the one-Supporter limit when a Supporter is in hand', () => {
    me.hand.cards.push(new TestTrainer('Professor Oak', TrainerType.SUPPORTER));
    const tips = getLearnTips(state, myId);
    expect(tips[0].id).toBe('trainers');
    expect(tips[0].text).toContain('only one Supporter per turn');
  });

  it('explains Special Conditions on the Active Pokemon first', () => {
    me.hand.cards.push(new TestEnergy());
    me.active.specialConditions = [SpecialCondition.POISONED];
    const tips = getLearnTips(state, myId);
    expect(tips.map(t => t.id)).toEqual(['conditions', 'energy']);
    expect(tips[0].text).toContain('Your Charmander is Poisoned');
    expect(tips[0].text).toContain('Retreating or evolving it cures it.');
  });

  it('does not suggest retreating an Asleep or Paralyzed Pokemon', () => {
    me.active.specialConditions = [SpecialCondition.ASLEEP];
    const tip = getLearnTips(state, myId)[0];
    expect(tip.text).toContain('Asleep');
    expect(tip.text).not.toContain('Retreating');
  });

  it('keeps to the tip limit, most relevant first', () => {
    me.bench = [];
    me.hand.cards.push(new TestPokemon('Growlithe'), new TestEnergy(),
      new TestTrainer('Bill', TrainerType.ITEM));
    me.active.specialConditions = [SpecialCondition.BURNED];
    expect(ids()).toEqual(['conditions', 'bench']);
    expect(ids().length).toBe(MAX_LEARN_TIPS);
  });

  it('tells the player to follow the log during the opponent\'s turn', () => {
    state.activePlayer = 1;
    me.hand.cards.push(new TestEnergy());
    expect(ids()).toEqual(['opponent-turn']);
  });

  it('links every tip to a section that exists on the rules page', () => {
    const sections = RULES_SECTIONS.map(s => s.id);
    me.bench = [];
    me.hand.cards.push(new TestPokemon('Growlithe'), new TestEnergy(),
      new TestPokemon('Charmeleon', Stage.STAGE_1, 'Charmander'),
      new TestTrainer('Bill', TrainerType.ITEM));
    me.active.specialConditions = [SpecialCondition.CONFUSED];

    const all: string[] = [];
    const collect = () => getLearnTips(state, myId).forEach(tip => all.push(tip.section));
    collect();
    me.active.specialConditions = [];
    collect();
    me.bench = [slotWith(new TestPokemon('Vulpix'))];
    collect();
    me.hand.cards = [new TestEnergy(), new TestTrainer('Bill', TrainerType.ITEM)];
    collect();
    me.hand.cards = [];
    collect();
    state.activePlayer = 1;
    collect();
    state.phase = GamePhase.SETUP;
    collect();

    expect(all.length).toBeGreaterThan(5);
    all.forEach(section => expect(sections).toContain(section));
  });

});
