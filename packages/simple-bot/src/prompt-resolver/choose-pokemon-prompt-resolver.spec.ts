import { State, Player, ResolvePromptAction, GameMessage, ChoosePokemonPrompt,
  PokemonCard, PokemonSlot, PlayerType, SlotType, EnergyCard, CardType } from '@ptcg/common';
import { ChoosePokemonPromptResolver } from './choose-pokemon-prompt-resolver';
import {
  allSimpleTactics,
  allPromptResolvers,
  defaultStateScores,
  defaultArbiterOptions
} from '../simple-bot-definitions';

class TestPokemon extends PokemonCard {
  name = 'energy';
  fullName = 'energy';
  set = 'test';
  hp = 100;
  constructor (name: string) {
    super();
    this.name = name;
  }
}

class TestEnergy extends EnergyCard {
  name = 'energy';
  fullName = 'energy';
  set = 'test';
  constructor (type: CardType) {
    super();
    this.provides = [ type ];
  }
}

describe('ChoosePokemonPromptResolver', () => {
  let resolver: ChoosePokemonPromptResolver;
  let prompt: ChoosePokemonPrompt;
  let state: State;
  let player: Player;
  let opponent: Player;

  function createSlot(): PokemonSlot {
    const slot = new PokemonSlot();
    slot.pokemons.cards = [ new TestPokemon('Test') ];
    return slot;
  }

  function setHp(cardList: PokemonSlot, hp: number): void {
    const pokemonCard = cardList.pokemons.cards[0] as PokemonCard;
    pokemonCard.hp = hp;
  }

  function createState(): State {
    const s = new State();
    for (let i = 0; i < 2; i ++) {
      const p = new Player();
      p.id = i;
      p.active = createSlot();
      for (let j = 0; j < 5; j++) {
        p.bench.push(createSlot());
      }
      s.players.push(p);
    }
    return s;
  }

  beforeEach(() => {
    const simpleBotOptions = {
      tactics: allSimpleTactics,
      promptResolvers: allPromptResolvers,
      scores: defaultStateScores,
      arbiter: defaultArbiterOptions
    };
    resolver = new ChoosePokemonPromptResolver(simpleBotOptions);    

    state = createState();
    player = state.players[0];
    opponent = state.players[1];

    prompt = new ChoosePokemonPrompt(
      player.id,
      GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,
      PlayerType.BOTTOM_PLAYER,
      [ SlotType.ACTIVE, SlotType.BENCH ]
    );
  });

  it('Should return undefined when other prompt type', () => {
    // given
    const other: any = { };
    // when
    const action = resolver.resolvePrompt(state, player, other);
    // then
    expect(action).toBeUndefined();
  });

  it('Should choose the strongest Pokemon', () => {
    // given
    setHp(player.bench[2], 150);
    prompt.options.min = 1;
    prompt.options.max = 1;

    // when
    const action = resolver.resolvePrompt(state, player, prompt) as ResolvePromptAction;
    const result: PokemonSlot[] = action.result;

    // then
    expect(action instanceof ResolvePromptAction).toBeTruthy();
    expect(result).toEqual([player.bench[2]]);
  });

  it('Should choose the weakest Pokemon for the opponent', () => {
    // given
    setHp(opponent.bench[2], 50);
    prompt.playerType = PlayerType.TOP_PLAYER;
    prompt.options.min = 1;
    prompt.options.max = 1;
    prompt.options.allowCancel = false;

    // when
    const action = resolver.resolvePrompt(state, player, prompt) as ResolvePromptAction;
    const result: PokemonSlot[] = action.result;

    // then
    expect(action instanceof ResolvePromptAction).toBeTruthy();
    expect(result).toEqual([opponent.bench[2]]);
  });

  it('Should choose the weakest Pokemon to deal damage', () => {
    // given
    setHp(player.bench[2], 50);
    prompt.options.min = 1;
    prompt.options.max = 1;
    prompt.options.allowCancel = false;
    prompt.message = GameMessage.CHOOSE_POKEMON_TO_DAMAGE;

    // when
    const action = resolver.resolvePrompt(state, player, prompt) as ResolvePromptAction;
    const result: PokemonSlot[] = action.result;

    // then
    expect(action instanceof ResolvePromptAction).toBeTruthy();
    expect(result).toEqual([player.bench[2]]);
  });

  it('Should choose the strongest opponent\'s Pokemon to deal damage', () => {
    // given
    setHp(player.bench[2], 200);
    setHp(player.bench[3], 50);
    setHp(opponent.bench[2], 150);
    prompt.playerType = PlayerType.ANY;
    prompt.options.min = 1;
    prompt.options.max = 1;
    prompt.message = GameMessage.CHOOSE_POKEMON_TO_DAMAGE;

    // when
    const action = resolver.resolvePrompt(state, player, prompt) as ResolvePromptAction;
    const result: PokemonSlot[] = action.result;

    // then
    expect(action instanceof ResolvePromptAction).toBeTruthy();
    expect(result).toEqual([opponent.bench[2]]);
  });

  it('Should cancel instead of dealing damage to own Pokemon', () => {
    // given
    setHp(player.bench[2], 50);
    prompt.options.min = 1;
    prompt.options.max = 1;
    prompt.message = GameMessage.CHOOSE_POKEMON_TO_DAMAGE;

    // when
    const action = resolver.resolvePrompt(state, player, prompt) as ResolvePromptAction;

    // then
    expect(action instanceof ResolvePromptAction).toBeTruthy();
    expect(action.result).toBeNull();
  });

  it('Should not choose blocked Pokemon', () => {
    // given
    setHp(player.bench[0], 250);
    setHp(player.bench[1], 200);
    setHp(player.bench[2], 150);
    prompt.options.min = 1;
    prompt.options.max = 2;
    prompt.options.blocked = [{ player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 1 }];

    // when
    const action = resolver.resolvePrompt(state, player, prompt) as ResolvePromptAction;
    const result: PokemonSlot[] = action.result;

    // then
    expect(action instanceof ResolvePromptAction).toBeTruthy();
    expect(result.length).toEqual(2);
    expect(result.includes(player.bench[0])).toBeTruthy();
    expect(result.includes(player.bench[2])).toBeTruthy();
  });


  describe('explain (learn mode)', () => {

    function setName(cardList: PokemonSlot, name: string): void {
      (cardList.pokemons.cards[0] as PokemonCard).name = name;
    }

    function answerAndExplain(): string {
      const action = resolver.resolvePrompt(state, player, prompt) as ResolvePromptAction;
      return resolver.explain(state, player, prompt, action);
    }

    it('names its own strongest Pokemon for a helpful effect', () => {
      setHp(player.bench[2], 150);
      setName(player.bench[2], 'Charizard');
      prompt.options.min = 1;
      prompt.options.max = 1;

      expect(answerAndExplain()).toBe('Chose Charizard to attach cards to: it is its own strongest '
        + 'Pokémon by the bot\'s measure (comparing HP, attack damage, Abilities and Retreat Cost).');
    });

    it('names the opponent\'s strongest Pokemon as the damage target', () => {
      setHp(player.bench[2], 200);
      setHp(opponent.bench[2], 150);
      setName(opponent.bench[2], 'Raichu');
      prompt.playerType = PlayerType.ANY;
      prompt.options.min = 1;
      prompt.options.max = 1;
      prompt.message = GameMessage.CHOOSE_POKEMON_TO_DAMAGE;

      const reason = answerAndExplain();
      expect(reason).toContain('Chose the opponent\'s Raichu to take the damage');
      expect(reason).toContain('it is the opponent\'s strongest Pokémon');
    });

    it('calls a forced choice of its own Pokemon to damage its weakest', () => {
      setHp(player.bench[2], 50);
      setName(player.bench[2], 'Magikarp');
      prompt.options.min = 1;
      prompt.options.max = 1;
      prompt.options.allowCancel = false;
      prompt.message = GameMessage.CHOOSE_POKEMON_TO_DAMAGE;

      expect(answerAndExplain()).toContain('Chose Magikarp to take the damage: it is its own weakest Pokémon');
    });

    it('explains choosing nothing when it cancels', () => {
      prompt.options.min = 1;
      prompt.options.max = 1;
      prompt.message = GameMessage.CHOOSE_POKEMON_TO_DAMAGE;

      expect(answerAndExplain()).toContain('Chose no Pokémon to take the damage');
    });

    it('says when there was only one Pokemon to choose', () => {
      player.bench = [ player.bench[0] ];
      setName(player.bench[0], 'Pikachu');
      prompt.message = GameMessage.CHOOSE_NEW_ACTIVE_POKEMON;
      prompt.slots = [ SlotType.BENCH ];
      prompt.options.min = 1;
      prompt.options.allowCancel = false;

      expect(answerAndExplain()).toBe('Chose Pikachu as its new Active Pokémon: it was the only choice.');
    });

    it('lists several chosen Pokemon', () => {
      setHp(player.bench[0], 250);
      setHp(player.bench[1], 200);
      setName(player.bench[0], 'Snorlax');
      setName(player.bench[1], 'Lapras');
      prompt.options.min = 1;
      prompt.options.max = 2;

      expect(answerAndExplain()).toContain('Chose Snorlax and Lapras to attach cards to: they rank highest');
    });

    it('has no reason for other prompts', () => {
      const other: any = { };
      const action = new ResolvePromptAction(1, null);
      expect(resolver.explain(state, player, other, action)).toBe('');
    });

  });

  describe('choosing a Pokemon for the Active Spot', () => {

    function setup(cardList: PokemonSlot, name: string, hp: number, cost: CardType[],
      energy: CardType[]): void {
      const card = cardList.pokemons.cards[0] as PokemonCard;
      card.name = name;
      card.hp = hp;
      card.attacks = [{ name: 'Tackle', cost, damage: '20', text: '' }];
      cardList.energies.cards = energy.map(e => new TestEnergy(e));
    }

    function choose(): { result: PokemonSlot[], reason: string } {
      const action = resolver.resolvePrompt(state, player, prompt) as ResolvePromptAction;
      return { result: action.result, reason: resolver.explain(state, player, prompt, action) };
    }

    beforeEach(() => {
      player.bench = [ player.bench[0], player.bench[1] ];
      opponent.bench = [ opponent.bench[0], opponent.bench[1] ];
      prompt.message = GameMessage.CHOOSE_NEW_ACTIVE_POKEMON;
      prompt.slots = [ SlotType.BENCH ];
      prompt.options.min = 1;
      prompt.options.max = 1;
      prompt.options.allowCancel = false;
    });

    it('promotes a Pokemon that can attack over a bigger one that cannot', () => {
      setup(player.bench[0], 'Snorlax', 150, [ CardType.COLORLESS, CardType.COLORLESS ], []);
      setup(player.bench[1], 'Charmander', 60, [ CardType.FIRE ], [ CardType.FIRE ]);

      const { result, reason } = choose();

      expect(result).toEqual([ player.bench[1] ]);
      expect(reason).toBe('Chose Charmander as its new Active Pokémon: it is its own strongest Pokémon '
        + 'by the bot\'s measure (first whether the attached Energy already pays for an attack, then HP, '
        + 'attack damage, Abilities and Retreat Cost). Its attached Energy already pays for an attack, '
        + 'so it can attack right away.');
    });

    it('counts any Energy toward a Colorless cost but not the wrong type', () => {
      setup(player.bench[0], 'Squirtle', 60, [ CardType.WATER ], [ CardType.FIRE ]);
      setup(player.bench[1], 'Rattata', 40, [ CardType.COLORLESS ], [ CardType.FIRE ]);

      expect(choose().result).toEqual([ player.bench[1] ]);
    });

    it('falls back to HP and the rest when every choice can attack', () => {
      setup(player.bench[0], 'Snorlax', 150, [ CardType.COLORLESS ], [ CardType.FIRE ]);
      setup(player.bench[1], 'Charmander', 60, [ CardType.FIRE ], [ CardType.FIRE ]);

      const { result, reason } = choose();

      expect(result).toEqual([ player.bench[0] ]);
      expect(reason).not.toContain('attack right away');
    });

    it('also counts Energy when choosing a Pokemon to switch in', () => {
      setup(player.bench[0], 'Snorlax', 150, [ CardType.COLORLESS ], []);
      setup(player.bench[1], 'Charmander', 60, [ CardType.FIRE ], [ CardType.FIRE ]);
      prompt.message = GameMessage.CHOOSE_POKEMON_TO_SWITCH;

      expect(choose().result).toEqual([ player.bench[1] ]);
    });

    it('drags up the opponent\'s Pokemon that cannot attack yet', () => {
      setup(opponent.bench[0], 'Charmander', 60, [ CardType.FIRE ], [ CardType.FIRE ]);
      setup(opponent.bench[1], 'Squirtle', 60, [ CardType.WATER ], []);
      prompt.message = GameMessage.CHOOSE_POKEMON_TO_SWITCH;
      prompt.playerType = PlayerType.TOP_PLAYER;

      const { result, reason } = choose();

      expect(result).toEqual([ opponent.bench[1] ]);
      expect(reason).toContain('Chose the opponent\'s Squirtle to switch into the Active Spot: it is the '
        + 'opponent\'s weakest Pokémon');
      expect(reason).toContain('It does not have the Energy for any of its attacks yet, '
        + 'so it cannot attack right away.');
    });

    it('ignores Energy for prompts that do not fill the Active Spot', () => {
      setup(player.bench[0], 'Snorlax', 150, [ CardType.COLORLESS ], []);
      setup(player.bench[1], 'Charmander', 60, [ CardType.FIRE ], [ CardType.FIRE ]);
      prompt.message = GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS;

      const { result, reason } = choose();

      expect(result).toEqual([ player.bench[0] ]);
      expect(reason).toContain('(comparing HP, attack damage, Abilities and Retreat Cost)');
    });

    it('goes back to the old ranking when the canAttack score is 0', () => {
      resolver = new ChoosePokemonPromptResolver({
        tactics: allSimpleTactics,
        promptResolvers: allPromptResolvers,
        scores: { ...defaultStateScores, activeChoice: { canAttack: 0 } },
        arbiter: defaultArbiterOptions
      });
      setup(player.bench[0], 'Snorlax', 150, [ CardType.COLORLESS ], []);
      setup(player.bench[1], 'Charmander', 60, [ CardType.FIRE ], [ CardType.FIRE ]);

      const { result, reason } = choose();

      expect(result).toEqual([ player.bench[0] ]);
      expect(reason).toContain('(comparing HP, attack damage, Abilities and Retreat Cost)');
    });

  });

});
