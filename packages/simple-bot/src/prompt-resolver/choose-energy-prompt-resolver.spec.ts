import { CardType, SuperType, State, Player, ResolvePromptAction, GameMessage, StateUtils } from '@ptcg/common';
import { ChooseEnergyPrompt, EnergyMap } from '@ptcg/common';
import { ChooseEnergyPromptResolver } from './choose-energy-prompt-resolver';
import {
  allSimpleTactics,
  allPromptResolvers,
  defaultStateScores,
  defaultArbiterOptions
} from '../simple-bot-definitions';

describe('ChooseEnergyPromptResolver', () => {

  let resolver: ChooseEnergyPromptResolver;
  let prompt: ChooseEnergyPrompt;
  let state: State;
  let player: Player;

  function createEnergy(name: string, provides: CardType[]): EnergyMap {
    const provideAmount = name === 'dce' ? 2 : 1;
    const card = { name, superType: SuperType.ENERGY, provides, provideAmount } as any;
    return { card, provides, provideAmount };
  }

  beforeEach(() => {
    const simpleBotOptions = {
      tactics: allSimpleTactics,
      promptResolvers: allPromptResolvers,
      scores: defaultStateScores,
      arbiter: defaultArbiterOptions
    };
    resolver = new ChooseEnergyPromptResolver(simpleBotOptions);    
    prompt = new ChooseEnergyPrompt(1, GameMessage.CHOOSE_CARD_TO_HAND, [], []);
    state = new State();
    player = new Player();
  });

  it('Should choose valid energy cost for [R]', () => {
    // given
    const fire = [ CardType.FIRE ];
    const dce = [ CardType.COLORLESS ];

    prompt.cost = [ CardType.FIRE ];
    prompt.energy = [
      createEnergy('fire', fire),
      createEnergy('fire', fire),
      createEnergy('dce', dce)
    ];

    // when
    const action = resolver.resolvePrompt(state, player, prompt) as ResolvePromptAction;

    // then
    expect(action instanceof ResolvePromptAction).toBeTruthy();
    expect(action.result).toEqual([createEnergy('fire', fire)]);
  });

  it('Should choose valid energy cost for [R] when dce is first', () => {
    // given
    const fire = [ CardType.FIRE ];
    const dce = [ CardType.COLORLESS ];

    prompt.cost = [ CardType.FIRE ];
    prompt.energy = [
      createEnergy('dce', dce),
      createEnergy('fire', fire),
      createEnergy('fire', fire)
    ];

    // when
    const action = resolver.resolvePrompt(state, player, prompt) as ResolvePromptAction;

    // then
    expect(action instanceof ResolvePromptAction).toBeTruthy();
    expect(action.result).toEqual([createEnergy('fire', fire)]);
  });

  it('Should choose valid energy cost for [RRC]', () => {
    // given
    const rainbow = StateUtils.rainbowEnergy();
    const fire = [ CardType.FIRE ];
    const dce = [ CardType.COLORLESS ];

    prompt.cost = [ CardType.FIRE, CardType.FIRE, CardType.COLORLESS ];
    prompt.energy = [
      createEnergy('dce', dce),
      createEnergy('fire', fire),
      createEnergy('rainbow', rainbow),
      createEnergy('rainbow', rainbow)
    ];

    // when
    const action = resolver.resolvePrompt(state, player, prompt) as ResolvePromptAction;

    // then
    expect(action instanceof ResolvePromptAction).toBeTruthy();
    expect(action.result).toEqual([
      createEnergy('fire', fire),
      createEnergy('rainbow', rainbow),
      createEnergy('dce', dce)
    ]);
  });

  it('Should choose valid energy cost for [C]', () => {
    // given
    const rainbow = StateUtils.rainbowEnergy();
    const fire = [ CardType.FIRE ];
    const dce = [ CardType.COLORLESS ];

    prompt.cost = [ CardType.COLORLESS ];
    prompt.energy = [
      createEnergy('dce', dce),
      createEnergy('fire', fire),
      createEnergy('rainbow', rainbow),
      createEnergy('rainbow', rainbow)
    ];

    // when
    const action = resolver.resolvePrompt(state, player, prompt) as ResolvePromptAction;

    // then
    expect(action instanceof ResolvePromptAction).toBeTruthy();
    expect(action.result).toEqual([
      createEnergy('fire', fire)
    ]);
  });

  it('Should choose valid energy cost for [CC]', () => {
    // given
    const rainbow = StateUtils.rainbowEnergy();
    const fire = [ CardType.FIRE ];
    const dce = [ CardType.COLORLESS ];

    prompt.cost = [ CardType.COLORLESS, CardType.COLORLESS ];
    prompt.energy = [
      createEnergy('dce', dce),
      createEnergy('fire', fire),
      createEnergy('rainbow', rainbow),
      createEnergy('rainbow', rainbow)
    ];

    // when
    const action = resolver.resolvePrompt(state, player, prompt) as ResolvePromptAction;

    // then
    expect(action instanceof ResolvePromptAction).toBeTruthy();
    expect(action.result).toEqual([
      createEnergy('dce', dce)
    ]);
  });

  it('Should choose valid energy cost for [WCC]', () => {
    // given
    const rainbow = StateUtils.rainbowEnergy();
    const fire = [ CardType.FIRE ];
    const dce = [ CardType.COLORLESS ];

    prompt.cost = [ CardType.WATER, CardType.COLORLESS, CardType.COLORLESS ];
    prompt.energy = [
      createEnergy('dce', dce),
      createEnergy('fire', fire),
      createEnergy('rainbow', rainbow),
      createEnergy('rainbow', rainbow)
    ];

    // when
    const action = resolver.resolvePrompt(state, player, prompt) as ResolvePromptAction;

    // then
    expect(action instanceof ResolvePromptAction).toBeTruthy();
    expect(action.result).toEqual([
      createEnergy('rainbow', rainbow),
      createEnergy('dce', dce)
    ]);
  });

  it('Should choose valid energy cost for [WCC] (impossible to pay)', () => {
    // given
    const fire = [ CardType.FIRE ];
    const dce = [ CardType.COLORLESS ];

    prompt.cost = [ CardType.WATER, CardType.COLORLESS, CardType.COLORLESS ];
    prompt.energy = [
      createEnergy('dce', dce),
      createEnergy('fire', fire)
    ];

    // when
    const action = resolver.resolvePrompt(state, player, prompt) as ResolvePromptAction;

    // then
    expect(action instanceof ResolvePromptAction).toBeTruthy();
    expect(action.result).toEqual(null);
  });

  describe('explain (learn mode)', () => {

    function named(name: string, provides: CardType[], provideAmount = 1): EnergyMap {
      const card = { name, superType: SuperType.ENERGY, provides, provideAmount } as any;
      return { card, provides, provideAmount };
    }

    it('names the Energy discarded to retreat and what it kept', () => {
      const fire = named('Fire Energy', [ CardType.FIRE ]);
      const dce = named('Double Colorless Energy', [ CardType.COLORLESS ], 2);
      prompt = new ChooseEnergyPrompt(1, GameMessage.CHOOSE_POKEMON_TO_SWITCH,
        [ dce, fire ], [ CardType.COLORLESS ]);

      const action = resolver.resolvePrompt(state, player, prompt) as ResolvePromptAction;
      const reason = resolver.explain(state, player, prompt, action);

      expect(action.result).toEqual([ fire ]);
      expect(reason).toBe('Discarded Fire Energy to pay the Retreat Cost (1 Colorless). '
        + 'It kept Double Colorless Energy: the bot pays a Colorless cost with the Energy that '
        + 'provides the least and uses no more Energy than needed.');
    });

    it('explains keeping the Energy that can provide more types', () => {
      const rainbow = named('Rainbow Energy', StateUtils.rainbowEnergy());
      const fire1 = named('Fire Energy', [ CardType.FIRE ]);
      const fire2 = named('Fire Energy', [ CardType.FIRE ]);
      prompt = new ChooseEnergyPrompt(1, GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
        [ rainbow, fire1, fire2 ], [ CardType.FIRE, CardType.FIRE ]);

      const action = resolver.resolvePrompt(state, player, prompt) as ResolvePromptAction;
      const reason = resolver.explain(state, player, prompt, action);

      expect(action.result).toEqual([ fire1, fire2 ]);
      expect(reason).toBe('Discarded 2 Fire Energy for the effect, which asks for 2 Fire Energy. '
        + 'It kept Rainbow Energy: the bot pays each typed Energy with the Energy that can provide '
        + 'the fewest types and uses no more Energy than needed.');
    });

    it('lists all three rules for a mixed cost', () => {
      const fire = named('Fire Energy', [ CardType.FIRE ]);
      const water = named('Water Energy', [ CardType.WATER ]);
      const dce = named('Double Colorless Energy', [ CardType.COLORLESS ], 2);
      prompt = new ChooseEnergyPrompt(1, GameMessage.CHOOSE_POKEMON_TO_SWITCH,
        [ dce, fire, water ], [ CardType.FIRE, CardType.COLORLESS ]);

      const action = resolver.resolvePrompt(state, player, prompt) as ResolvePromptAction;
      const reason = resolver.explain(state, player, prompt, action);

      expect(action.result).toEqual([ fire, water ]);
      expect(reason).toContain('Discarded Fire Energy and Water Energy to pay the Retreat Cost '
        + '(1 Fire and 1 Colorless).');
      expect(reason).toContain('It kept Double Colorless Energy: the bot pays each typed Energy with '
        + 'the Energy that can provide the fewest types, pays the Colorless cost with the Energy that '
        + 'provides the least and uses no more Energy than needed.');
    });

    it('says when it had to use all of its Energy', () => {
      const fire = named('Fire Energy', [ CardType.FIRE ]);
      prompt = new ChooseEnergyPrompt(1, GameMessage.CHOOSE_POKEMON_TO_SWITCH,
        [ fire ], [ CardType.COLORLESS ]);

      const action = resolver.resolvePrompt(state, player, prompt) as ResolvePromptAction;

      expect(resolver.explain(state, player, prompt, action)).toBe(
        'Discarded Fire Energy to pay the Retreat Cost (1 Colorless). '
        + 'That was all the Energy it could choose from.');
    });

    it('gives no ranking rule when only more of the same Energy was left', () => {
      const water1 = named('Water Energy', [ CardType.WATER ]);
      const water2 = named('Water Energy', [ CardType.WATER ]);
      prompt = new ChooseEnergyPrompt(1, GameMessage.CHOOSE_POKEMON_TO_SWITCH,
        [ water1, water2 ], [ CardType.COLORLESS ]);

      const action = resolver.resolvePrompt(state, player, prompt) as ResolvePromptAction;

      expect(action.result).toEqual([ water1 ]);
      expect(resolver.explain(state, player, prompt, action)).toBe(
        'Discarded Water Energy to pay the Retreat Cost (1 Colorless). It kept Water Energy.');
    });

    it('says when the Energy cannot pay the cost', () => {
      const fire = named('Fire Energy', [ CardType.FIRE ]);
      prompt = new ChooseEnergyPrompt(1, GameMessage.CHOOSE_POKEMON_TO_SWITCH,
        [ fire ], [ CardType.WATER ]);

      const action = resolver.resolvePrompt(state, player, prompt) as ResolvePromptAction;

      expect(action.result).toBeNull();
      expect(resolver.explain(state, player, prompt, action)).toBe(
        'Did not retreat: its Energy cannot pay the Retreat Cost (1 Water).');
    });

    it('gives no reason for other prompts', () => {
      const other = { id: 1 } as any;
      const action = new ResolvePromptAction(1, null);
      expect(resolver.explain(state, player, other, action)).toBe('');
    });

  });

});
