import { GameMessage } from '../../game-message';
import { PlayCardAction, PlayerType, SlotType } from '../actions/play-card-action';
import { TrainerCard } from '../card/trainer-card';
import { TrainerType } from '../card/card-types';
import { StoreLike } from '../store-like';
import { Player } from '../state/player';
import { GamePhase, State } from '../state/state';
import { playCardReducer } from './play-card-reducer';

class TestSupporter extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;
  public set: string = 'TEST';
  public name: string = 'Test Supporter';
  public fullName: string = 'Test Supporter TEST';
}

function createFirstTurnState(card: TrainerCard): State {
  const state = new State();
  const player = new Player();

  player.id = 1;
  player.hand.cards = [card];

  state.phase = GamePhase.PLAYER_TURN;
  state.turn = 1;
  state.activePlayer = 0;
  state.players = [player];
  state.rules.firstTurnUseSupporter = false;

  return state;
}

function createPlayAction(): PlayCardAction {
  return new PlayCardAction(1, 0, {
    player: PlayerType.BOTTOM_PLAYER,
    slot: SlotType.BOARD,
    index: 0,
  });
}

describe('playCardReducer first-turn Supporter rules', () => {
  it('keeps the default first-turn Supporter restriction', () => {
    const state = createFirstTurnState(new TestSupporter());
    const store = {
      reduceEffect: (currentState: State) => currentState,
    } as unknown as StoreLike;

    let errorMessage: string | undefined;
    try {
      playCardReducer(store, state, createPlayAction());
    } catch (error) {
      errorMessage = (error as { message?: string }).message;
    }

    expect(errorMessage).toBe(GameMessage.CANNOT_PLAY_THIS_CARD);
  });

  it('allows a Supporter that explicitly opts in to first-turn use', () => {
    const supporter = new TestSupporter();
    supporter.canUseOnFirstTurn = true;

    const state = createFirstTurnState(supporter);
    const reduceEffect = jasmine.createSpy('reduceEffect')
      .and.callFake((currentState: State) => currentState);
    const store = { reduceEffect } as unknown as StoreLike;

    expect(playCardReducer(store, state, createPlayAction())).toBe(state);
    expect(reduceEffect).toHaveBeenCalled();
  });
});
