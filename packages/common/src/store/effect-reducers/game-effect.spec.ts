import { AttackAction } from '../actions/game-actions';
import { Attack } from '../card/pokemon-types';
import { CardType, SpecialCondition } from '../card/card-types';
import { CoinFlipPrompt } from '../prompts/coin-flip-prompt';
import { ConfusionDamageEffect, AttackEffect } from '../effects/game-effects';
import { DealDamageEffect } from '../effects/attack-effects';
import { Effect } from '../effects/effect';
import { PokemonSlot } from '../state/pokemon-slot';
import { State } from '../state/state';
import { Store } from '../store';
import { StoreLike } from '../store-like';
import { TestBasic, createStore, createTurnState, resolve, unresolved } from '../reducers/reducer-test-utils';

class FrenzyBasic extends TestBasic {
  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof ConfusionDamageEffect && effect.target.getPokemonCard() === this) {
      effect.damage += 30;
    }
    return super.reduceEffect(store, state, effect);
  }
}

class PreventConfusionBasic extends TestBasic {
  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof ConfusionDamageEffect && effect.target.getPokemonCard() === this) {
      effect.preventDefault = true;
    }
    return super.reduceEffect(store, state, effect);
  }
}

describe('gameReducer - confusion damage', () => {
  let state: State;
  let store: Store;

  beforeEach(() => {
    state = createTurnState(3);
    store = createStore(state);
  });

  function attackAndFlip(result: boolean) {
    state.players[0].active.addSpecialCondition(SpecialCondition.CONFUSED);
    store.dispatch(new AttackAction(1, 'Test attack'));
    const flip = unresolved(store)[0] as CoinFlipPrompt;
    expect(flip instanceof CoinFlipPrompt).toBeTrue();
    resolve(store, flip, result);
  }

  it('Should put 30 damage on a Confused Pokemon that flips tails', () => {
    attackAndFlip(false);
    expect(store.state.players[0].active.damage).toEqual(30);
    expect(store.state.players[1].active.damage).toEqual(0);
    expect(store.state.activePlayer).toEqual(1);
  });

  it('Should send a ConfusionDamageEffect that cards can see', () => {
    const card = state.players[0].active.getPokemonCard() as TestBasic;
    attackAndFlip(false);
    const effects = card.effects.filter(e => e instanceof ConfusionDamageEffect) as ConfusionDamageEffect[];
    expect(effects.length).toEqual(1);
    expect(effects[0].player).toBe(store.state.players[0]);
    expect(effects[0].damage).toEqual(30);
  });

  it('Should let cards increase the confusion damage', () => {
    state.players[0].active.pokemons.cards = [new FrenzyBasic()];
    attackAndFlip(false);
    expect(store.state.players[0].active.damage).toEqual(60);
  });

  it('Should let cards prevent the confusion damage', () => {
    state.players[0].active.pokemons.cards = [new PreventConfusionBasic()];
    attackAndFlip(false);
    expect(store.state.players[0].active.damage).toEqual(0);
  });

  it('Should attack normally on heads', () => {
    attackAndFlip(true);
    expect(store.state.players[0].active.damage).toEqual(0);
    expect(store.state.players[1].active.damage).toEqual(10);
  });
});

describe('attackReducer - DealDamageEffect source', () => {
  let state: State;
  let store: Store;
  const attack: Attack = { name: 'Effect', cost: [], damage: '', text: '' };

  beforeEach(() => {
    state = createTurnState(3);
    store = createStore(state);
  });

  it('Should check Weakness against the source of the damage, not the Active Pokemon', () => {
    const player = state.players[0];
    const opponent = state.players[1];
    (player.active.getPokemonCard() as TestBasic).cardTypes = [CardType.FIRE];
    (opponent.active.getPokemonCard() as TestBasic).weakness = [{ type: CardType.WATER }];

    const waterSource = new PokemonSlot();
    const waterCard = new TestBasic('Water Source');
    waterCard.cardTypes = [CardType.WATER];
    waterSource.pokemons.cards = [waterCard];

    const dealDamage = new DealDamageEffect(new AttackEffect(player, opponent, attack), 20);
    dealDamage.source = waterSource;
    store.reduceEffect(state, dealDamage);

    expect(opponent.active.damage).toEqual(40);
  });

  it('Should default the source to the Active Pokemon', () => {
    const player = state.players[0];
    const opponent = state.players[1];
    (player.active.getPokemonCard() as TestBasic).cardTypes = [CardType.FIRE];
    (opponent.active.getPokemonCard() as TestBasic).weakness = [{ type: CardType.WATER }];

    store.reduceEffect(state, new DealDamageEffect(new AttackEffect(player, opponent, attack), 20));

    expect(opponent.active.damage).toEqual(20);
  });
});
