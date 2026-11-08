import { KnockOutEffect } from '../effects/game-effects';
import { CardTag } from '../card/card-types';
import { StateUtils } from '../state-utils';
import { TestBasic, createStore, createTurnState } from '../reducers/reducer-test-utils';

describe('gameReducer - Knock Out turn tracking', () => {

  it('records the turn a player\'s Pokémon was Knocked Out', () => {
    const state = createTurnState(4);
    const store = createStore(state);
    const owner = state.players[1];
    expect(owner.knockedOutTurn).toEqual(-1);
    store.reduceEffect(state, new KnockOutEffect(owner, owner.active));
    expect(owner.knockedOutTurn).toEqual(4);
    expect(state.players[0].knockedOutTurn).toEqual(-1);
  });

  it('wasKnockedOutLastTurn is true only on the next turn', () => {
    const state = createTurnState(4);
    const player = state.players[1];
    player.knockedOutTurn = 4;
    expect(StateUtils.wasKnockedOutLastTurn(state, player)).toBeFalse();
    state.turn = 5;
    expect(StateUtils.wasKnockedOutLastTurn(state, player)).toBeTrue();
    state.turn = 6;
    expect(StateUtils.wasKnockedOutLastTurn(state, player)).toBeFalse();
  });

  it('never matches for a player without Knock Outs (also old saved games)', () => {
    const state = createTurnState(1);
    const player = state.players[0];
    expect(StateUtils.wasKnockedOutLastTurn(state, player)).toBeFalse();
    delete (player as any).knockedOutTurn;
    expect(StateUtils.wasKnockedOutLastTurn(state, player)).toBeFalse();
  });

  it('hasRuleBox: ex, GX and LV.X have a Rule Box; Tera alone does not', () => {
    const card = new TestBasic();
    expect(StateUtils.hasRuleBox(card)).toBeFalse();
    card.tags = [CardTag.TERA];
    expect(StateUtils.hasRuleBox(card)).toBeFalse();
    card.tags = [CardTag.TERA, CardTag.POKEMON_EX];
    expect(StateUtils.hasRuleBox(card)).toBeTrue();
    card.tags = [CardTag.POKEMON_GX];
    expect(StateUtils.hasRuleBox(card)).toBeTrue();
  });

  it('prize count: 1 for a plain Pokémon, 2 for a Pokémon ex, 3 for a Mega Evolution Pokémon ex', () => {
    const prizesFor = (tags: string[]) => {
      const state = createTurnState(4);
      const store = createStore(state);
      const owner = state.players[1];
      const card = owner.active.getPokemonCard() as TestBasic;
      card.tags = tags;
      const effect = new KnockOutEffect(owner, owner.active);
      store.reduceEffect(state, effect);
      return effect.prizeCount;
    };
    expect(prizesFor([])).toEqual(1);
    expect(prizesFor([CardTag.POKEMON_EX])).toEqual(2);
    expect(prizesFor([CardTag.POKEMON_EX, CardTag.MEGA_EVOLUTION_EX])).toEqual(3);
  });
});
