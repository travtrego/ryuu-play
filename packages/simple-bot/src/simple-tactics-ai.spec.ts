import { State, Player, PokemonSlot, PokemonCard, EnergyCard, CardType, Stage,
  CardList, GamePhase, PlayCardAction, AttackAction, PassTurnAction, RetreatAction,
  SpecialCondition, Card } from '@ptcg/common';
import { SimpleTacticsAi } from './simple-tactics-ai';
import { SimpleBotOptions } from './simple-bot-options';
import {
  allSimpleTactics,
  allPromptResolvers,
  defaultStateScores,
  defaultArbiterOptions
} from './simple-bot-definitions';

class TestEnergy extends EnergyCard {
  name = 'energy';
  fullName = 'energy';
  set = 'test';
  constructor(type: CardType) {
    super();
    this.provides = [ type ];
    this.name = CardType[type].charAt(0) + CardType[type].slice(1).toLowerCase() + ' Energy';
    this.fullName = this.name;
  }
}

class TestPokemon extends PokemonCard {
  name = 'pokemon';
  fullName = 'pokemon';
  set = 'test';
  constructor(name: string, hp: number, attacks: { name: string, cost: CardType[], damage: string }[],
    stage: Stage = Stage.BASIC, evolvesFrom: string = '', retreat: CardType[] = []) {
    super();
    this.name = name;
    this.fullName = name;
    this.hp = hp;
    this.stage = stage;
    this.evolvesFrom = evolvesFrom;
    this.retreat = retreat;
    this.attacks = attacks.map(a => ({ ...a, text: '' }));
  }
}

describe('SimpleTacticsAi learn-mode reasons', () => {
  let options: SimpleBotOptions;
  let state: State;
  let bot: Player;
  let opponent: Player;
  let nextId: number;

  function withId<T extends Card>(card: T): T {
    card.id = nextId++;
    return card;
  }

  function slotOf(card: PokemonCard): PokemonSlot {
    const slot = new PokemonSlot();
    slot.pokemons.cards = [ withId(card) ];
    slot.pokemonPlayedTurn = 1;
    return slot;
  }

  function createPlayer(id: number, active: PokemonCard): Player {
    const p = new Player();
    p.id = id;
    p.name = 'player' + id;
    p.active = slotOf(active);
    for (let i = 0; i < 5; i++) {
      p.bench.push(new PokemonSlot());
    }
    for (let i = 0; i < 20; i++) {
      p.deck.cards.push(withId(new TestEnergy(CardType.COLORLESS)));
    }
    for (let i = 0; i < 6; i++) {
      const prize = new CardList();
      prize.cards.push(withId(new TestEnergy(CardType.COLORLESS)));
      p.prizes.push(prize);
    }
    return p;
  }

  function charmander(): TestPokemon {
    return new TestPokemon('Charmander', 50, [
      { name: 'Scratch', cost: [ CardType.COLORLESS ], damage: '10' },
      { name: 'Ember', cost: [ CardType.FIRE, CardType.COLORLESS ], damage: '30' }
    ], Stage.BASIC, '', [ CardType.COLORLESS ]);
  }

  function decide(): { action: any, reason: string } {
    const ai = new SimpleTacticsAi(bot.id, options, null);
    const action = ai.decodeNextAction(state);
    return { action, reason: ai.explainLastAction() || '' };
  }

  beforeEach(() => {
    nextId = 1;
    options = {
      tactics: allSimpleTactics,
      promptResolvers: allPromptResolvers,
      scores: defaultStateScores,
      arbiter: defaultArbiterOptions
    };
    state = new State();
    state.phase = GamePhase.PLAYER_TURN;
    state.turn = 3;
    bot = createPlayer(1, charmander());
    opponent = createPlayer(2, new TestPokemon('Squirtle', 50, [
      { name: 'Bubble', cost: [ CardType.WATER ], damage: '10' }
    ]));
    state.players = [ bot, opponent ];
    state.activePlayer = 0;
  });

  it('explains an Energy attachment that unlocks an attack', () => {
    bot.active.energies.cards.push(withId(new TestEnergy(CardType.FIRE)));
    bot.hand.cards.push(withId(new TestEnergy(CardType.FIRE)));

    const { action, reason } = decide();

    expect(action instanceof PlayCardAction).toBe(true);
    expect(reason).toContain('Attached Fire Energy to Charmander');
    expect(reason).toContain('so it can use Ember this turn');
  });

  it('explains an Energy attachment that only gets closer to an attack', () => {
    bot.active.pokemons.cards[0] = withId(new TestPokemon('Charmander', 50, [
      { name: 'Flamethrower', cost: [ CardType.FIRE, CardType.FIRE, CardType.COLORLESS ], damage: '60' }
    ]));
    bot.hand.cards.push(withId(new TestEnergy(CardType.FIRE)));

    const { action, reason } = decide();

    expect(action instanceof PlayCardAction).toBe(true);
    expect(reason).toContain('to get closer to Flamethrower (it still needs 2 more Energy)');
  });

  it('explains an evolution with the HP gain', () => {
    bot.hand.cards.push(withId(new TestPokemon('Charmeleon', 80, [
      { name: 'Slash', cost: [ CardType.COLORLESS, CardType.COLORLESS ], damage: '50' }
    ], Stage.STAGE_1, 'Charmander')));

    const { action, reason } = decide();

    expect(action instanceof PlayCardAction).toBe(true);
    expect(reason).toContain('Evolved Charmander into Charmeleon');
    expect(reason).toContain('HP goes from 50 to 80');
  });

  it('explains benching a Basic Pokémon when the Bench is empty', () => {
    bot.hand.cards.push(withId(new TestPokemon('Vulpix', 50, [])));

    const { action, reason } = decide();

    expect(action instanceof PlayCardAction).toBe(true);
    expect(reason).toContain('Put Vulpix on the Bench');
    expect(reason).toContain('empty Bench');
  });

  it('explains an attack with the damage and Knock Out the simulation predicts', () => {
    bot.active.energies.cards.push(withId(new TestEnergy(CardType.FIRE)));
    bot.active.energies.cards.push(withId(new TestEnergy(CardType.FIRE)));
    opponent.active.damage = 20;
    opponent.bench[0] = slotOf(new TestPokemon('Psyduck', 60, []));

    const { action, reason } = decide();

    expect(action instanceof AttackAction).toBe(true);
    expect((action as AttackAction).name).toBe('Ember');
    expect(reason).toContain('Attacked with Charmander\'s Ember');
    expect(reason).toContain('Knocks Out Squirtle');
    expect(reason).toContain('takes 1 Prize card');
  });

  it('says when an attack plan depends on coin flips', () => {
    bot.active.pokemons.cards[0] = withId(new TestPokemon('Pikachu', 60, [
      { name: 'Thunder Jolt', cost: [ CardType.COLORLESS ], damage: '30' }
    ]));
    (bot.active.getPokemonCard() as PokemonCard).attacks[0].text =
      'Flip a coin. If tails, this Pokémon does 10 damage to itself.';
    bot.active.energies.cards.push(withId(new TestEnergy(CardType.LIGHTNING)));

    const { action, reason } = decide();

    expect(action instanceof AttackAction).toBe(true);
    expect(reason).toContain('puts 30 damage on Squirtle');
    expect(reason).toContain('as if its coin flips land heads');
  });

  it('explains passing when the Active Pokémon has no Energy for an attack', () => {
    const { action, reason } = decide();

    expect(action instanceof PassTurnAction).toBe(true);
    expect(reason).toContain('does not have enough Energy for any attack yet');
  });

  it('explains passing when the Active Pokémon is Paralyzed', () => {
    bot.active.specialConditions.push(SpecialCondition.PARALYZED);

    const { action, reason } = decide();

    expect(action instanceof PassTurnAction).toBe(true);
    expect(reason).toContain('Charmander is Paralyzed');
  });

  it('explains a retreat to a Pokémon that can attack', () => {
    bot.active.pokemons.cards[0] = withId(new TestPokemon('Magikarp', 30, [
      { name: 'Splash', cost: [ CardType.WATER, CardType.WATER, CardType.WATER ], damage: '10' }
    ], Stage.BASIC, '', [ CardType.COLORLESS ]));
    bot.active.energies.cards.push(withId(new TestEnergy(CardType.FIRE)));
    bot.bench[0] = slotOf(charmander());
    bot.bench[0].energies.cards.push(withId(new TestEnergy(CardType.FIRE)));
    bot.bench[0].energies.cards.push(withId(new TestEnergy(CardType.FIRE)));
    bot.energyPlayedTurn = state.turn;

    const { action, reason } = decide();

    expect(action instanceof RetreatAction).toBe(true);
    expect(reason).toContain('Retreated Magikarp for Charmander');
    expect(reason).toContain('Charmander has the Energy to use Ember');
    expect(reason).toContain('Retreating discards 1 Energy');
  });

  it('records the deciding tactic with the reason', () => {
    bot.hand.cards.push(withId(new TestEnergy(CardType.FIRE)));
    const ai = new SimpleTacticsAi(bot.id, options, null);

    const action = ai.decodeNextAction(state);
    const decision = ai.getLastDecision();

    expect(decision).toBeDefined();
    expect(decision && decision.action).toBe(action as any);
    expect(decision && decision.tactic).toBe('AttachEnergyTactic');
  });

  it('has no reason when it is not the bot\'s turn', () => {
    state.activePlayer = 1;
    const ai = new SimpleTacticsAi(bot.id, options, null);

    expect(ai.decodeNextAction(state)).toBeUndefined();
    expect(ai.explainLastAction()).toBeUndefined();
  });

});
