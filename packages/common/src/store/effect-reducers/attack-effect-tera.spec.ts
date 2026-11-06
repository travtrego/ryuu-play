import { AttackEffect } from '../effects/game-effects';
import { CardTag } from '../card/card-types';
import { PutDamageEffect } from '../effects/attack-effects';
import { State } from '../state/state';
import { Store } from '../store';
import { TestBasic, createStore, createTurnState } from '../reducers/reducer-test-utils';

class TeraBasic extends TestBasic {
  public tags = [CardTag.TERA];
}

describe('attackReducer - Tera rule', () => {
  let state: State;
  let store: Store;

  beforeEach(() => {
    state = createTurnState(3);
    store = createStore(state);
  });

  function damage(targetIsActive: boolean, card: TestBasic, amount = 30, ownSide = false) {
    const player = state.players[0];
    const opponent = state.players[1];
    const owner = ownSide ? player : opponent;
    const target = targetIsActive ? owner.active : owner.bench[0];
    target.pokemons.cards = [card];
    const attackEffect = new AttackEffect(player, opponent, player.active.getPokemonCard()!.attacks[0]);
    const put = new PutDamageEffect(attackEffect, amount);
    put.target = target;
    store.reduceEffect(state, put);
    return target;
  }

  it('prevents attack damage to a Benched Tera Pokémon', () => {
    expect(damage(false, new TeraBasic()).damage).toEqual(0);
  });

  it('also prevents damage from its own player\'s attacks', () => {
    expect(damage(false, new TeraBasic(), 30, true).damage).toEqual(0);
  });

  it('does not protect a Tera Pokémon in the Active Spot', () => {
    expect(damage(true, new TeraBasic()).damage).toEqual(30);
  });

  it('does not protect a Benched Pokémon without the Tera tag', () => {
    expect(damage(false, new TestBasic()).damage).toEqual(30);
  });
});
