import { CardTarget, PlayCardAction, PlayerType, SlotType } from '../actions/play-card-action';
import { GameLog, GameMessage } from '../../game-message';
import { GamePhase, State } from '../state/state';
import { Player } from '../state/player';
import { Store } from '../store';
import { TrainerEffect } from '../effects/play-card-effects';
import { TrainerType } from '../card/card-types';
import {
  TestBasic,
  TestEnergy,
  TestStage1,
  TestTrainer,
  createStore,
  createTurnState,
  dispatchError
} from './reducer-test-utils';

describe('playCardReducer', () => {

  let state: State;
  let store: Store;
  let player: Player;

  const active: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
  const bench0: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 };
  const board: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BOARD, index: 0 };
  const oppActive: CardTarget = { player: PlayerType.TOP_PLAYER, slot: SlotType.ACTIVE, index: 0 };
  const oppBench0: CardTarget = { player: PlayerType.TOP_PLAYER, slot: SlotType.BENCH, index: 0 };
  const anyActive: CardTarget = { player: PlayerType.ANY, slot: SlotType.ACTIVE, index: 0 };

  function current(): Player {
    return store.state.players[0];
  }

  function logs(): string[] {
    return store.state.logs.map(l => l.message);
  }

  beforeEach(() => {
    state = createTurnState(3);
    store = createStore(state);
    player = state.players[0];
  });

  it('Should do nothing outside of the PLAYER_TURN phase', () => {
    state.phase = GamePhase.FINISHED;
    player.hand.cards = [new TestEnergy()];
    store.dispatch(new PlayCardAction(1, 0, active));
    expect(current().hand.cards.length).toBe(1);
  });

  it('Should throw NOT_YOUR_TURN for the inactive player', () => {
    state.players[1].hand.cards = [new TestEnergy()];
    expect(dispatchError(store, new PlayCardAction(2, 0, active))).toBe(GameMessage.NOT_YOUR_TURN);
  });

  it('Should throw UNKNOWN_CARD for an invalid hand index', () => {
    expect(dispatchError(store, new PlayCardAction(1, 0, active))).toBe(GameMessage.UNKNOWN_CARD);
  });

  describe('Energy', () => {
    it('Should attach energy once per turn', () => {
      const energy = new TestEnergy();
      const second = new TestEnergy();
      player.hand.cards = [energy, second];

      store.dispatch(new PlayCardAction(1, 0, active));
      expect(current().active.energies.cards).toEqual([energy]);
      expect(current().energyPlayedTurn).toBe(3);
      expect(logs()).toContain(GameLog.LOG_PLAYER_ATTACHES_CARD);

      expect(dispatchError(store, new PlayCardAction(1, 0, active))).toBe(GameMessage.ENERGY_ALREADY_ATTACHED);
      expect(current().hand.cards).toEqual([second]);
    });

    it('Should throw INVALID_TARGET for empty slot or board target', () => {
      player.hand.cards = [new TestEnergy()];
      expect(dispatchError(store, new PlayCardAction(1, 0, bench0))).toBe(GameMessage.INVALID_TARGET);
      expect(dispatchError(store, new PlayCardAction(1, 0, board))).toBe(GameMessage.INVALID_TARGET);
      const badBench: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 9 };
      expect(dispatchError(store, new PlayCardAction(1, 0, badBench))).toBe(GameMessage.INVALID_TARGET);
      // A rejected attach must not consume the once-per-turn energy drop
      expect(current().energyPlayedTurn).toBe(0);
    });

    it('Should not attach energy to the opponent\'s Pokemon', () => {
      player.hand.cards = [new TestEnergy()];
      expect(dispatchError(store, new PlayCardAction(1, 0, oppActive))).toBe(GameMessage.INVALID_TARGET);
      expect(dispatchError(store, new PlayCardAction(1, 0, anyActive))).toBe(GameMessage.INVALID_TARGET);
      expect(store.state.players[1].active.energies.cards).toEqual([]);
      expect(current().hand.cards.length).toBe(1);
      expect(current().energyPlayedTurn).toBe(0);
    });

    it('Should resolve targets from the active player point of view', () => {
      // Player 2 is active, BOTTOM_PLAYER refers to players[1]
      state.activePlayer = 1;
      const energy = new TestEnergy();
      state.players[1].hand.cards = [energy];
      store.dispatch(new PlayCardAction(2, 0, active));
      expect(store.state.players[1].active.energies.cards).toEqual([energy]);
      expect(store.state.players[0].active.energies.cards).toEqual([]);
    });
  });

  describe('Pokemon', () => {
    it('Should play basic pokemon to the bench', () => {
      const basic = new TestBasic('Bench Basic');
      player.hand.cards = [basic];
      store.dispatch(new PlayCardAction(1, 0, bench0));
      expect(current().bench[0].getPokemonCard()).toBe(basic);
      expect(current().bench[0].pokemonPlayedTurn).toBe(3);
      expect(logs()).toContain(GameLog.LOG_PLAYER_PLAYS_BASIC_POKEMON);
    });

    it('Should throw INVALID_TARGET for a board target', () => {
      player.hand.cards = [new TestBasic()];
      expect(dispatchError(store, new PlayCardAction(1, 0, board))).toBe(GameMessage.INVALID_TARGET);
    });

    it('Should not play basic pokemon onto the opponent\'s bench', () => {
      player.hand.cards = [new TestBasic('Bench Basic')];
      expect(dispatchError(store, new PlayCardAction(1, 0, oppBench0))).toBe(GameMessage.INVALID_TARGET);
      expect(dispatchError(store, new PlayCardAction(1, 0, { ...oppBench0, player: PlayerType.ANY })))
        .toBe(GameMessage.INVALID_TARGET);
      expect(store.state.players[1].bench[0].pokemons.cards).toEqual([]);
      expect(current().hand.cards.length).toBe(1);
    });

    it('Should not evolve the opponent\'s Pokemon', () => {
      player.hand.cards = [new TestStage1()];
      store.state.players[1].active.pokemonPlayedTurn = 1;
      expect(dispatchError(store, new PlayCardAction(1, 0, oppActive))).toBe(GameMessage.INVALID_TARGET);
      expect(store.state.players[1].active.pokemons.cards.length).toBe(1);
    });

    it('Should not play basic pokemon onto an occupied slot', () => {
      player.hand.cards = [new TestBasic('Other')];
      expect(dispatchError(store, new PlayCardAction(1, 0, active))).toBe(GameMessage.INVALID_TARGET);
    });

    it('Should evolve pokemon played on an earlier turn', () => {
      const stage1 = new TestStage1();
      player.hand.cards = [stage1];
      player.active.pokemonPlayedTurn = 1;
      store.dispatch(new PlayCardAction(1, 0, active));
      expect(current().active.getPokemonCard()).toBe(stage1);
      expect(current().active.pokemons.cards.length).toBe(2);
    });

    it('Should not evolve pokemon played this turn', () => {
      player.hand.cards = [new TestStage1()];
      player.active.pokemonPlayedTurn = 3;
      expect(dispatchError(store, new PlayCardAction(1, 0, active)))
        .toBe(GameMessage.POKEMON_CANT_EVOLVE_THIS_TURN);
    });
  });

  describe('Supporter', () => {
    it('Should play a supporter into the supporter zone', () => {
      const supporter = new TestTrainer('Supporter', TrainerType.SUPPORTER);
      player.hand.cards = [supporter];
      store.dispatch(new PlayCardAction(1, 0, board));
      expect(current().supporter.cards).toEqual([supporter]);
      expect(supporter.effects.some(e => e instanceof TrainerEffect)).toBe(true);
      expect(logs()).toContain(GameLog.LOG_PLAYER_PLAYS_SUPPORTER);
    });

    it('Should allow only one supporter per turn', () => {
      player.hand.cards = [
        new TestTrainer('Supporter', TrainerType.SUPPORTER),
        new TestTrainer('Supporter 2', TrainerType.SUPPORTER)
      ];
      store.dispatch(new PlayCardAction(1, 0, board));
      expect(dispatchError(store, new PlayCardAction(1, 0, board))).toBe(GameMessage.SUPPORTER_ALREADY_PLAYED);
      expect(current().hand.cards.length).toBe(1);
    });

    it('Should not play supporter on first turn when rules forbid it', () => {
      state.turn = 1;
      state.rules.firstTurnUseSupporter = false;
      player.hand.cards = [new TestTrainer('Supporter', TrainerType.SUPPORTER)];
      expect(dispatchError(store, new PlayCardAction(1, 0, board))).toBe(GameMessage.CANNOT_PLAY_THIS_CARD);
    });

    it('Should play supporter on first turn when rules allow it', () => {
      state.turn = 1;
      state.rules.firstTurnUseSupporter = true;
      player.hand.cards = [new TestTrainer('Supporter', TrainerType.SUPPORTER)];
      store.dispatch(new PlayCardAction(1, 0, board));
      expect(current().supporter.cards.length).toBe(1);
    });
  });

  describe('Stadium', () => {
    it('Should play stadium and replace opponent stadium', () => {
      const old = new TestTrainer('Old Stadium', TrainerType.STADIUM);
      state.players[1].stadium.cards = [old];
      const stadium = new TestTrainer('New Stadium', TrainerType.STADIUM);
      player.hand.cards = [stadium];
      player.stadiumUsedTurn = 3;

      store.dispatch(new PlayCardAction(1, 0, board));

      expect(current().stadium.cards).toEqual([stadium]);
      expect(current().stadiumPlayedTurn).toBe(3);
      expect(current().stadiumUsedTurn).toBe(0);
      expect(store.state.players[1].stadium.cards).toEqual([]);
      expect(store.state.players[1].discard.cards).toEqual([old]);
      expect(logs()).toContain(GameLog.LOG_PLAYER_PLAYS_STADIUM);
    });

    it('Should replace own stadium', () => {
      const old = new TestTrainer('Old Stadium', TrainerType.STADIUM);
      player.stadium.cards = [old];
      player.hand.cards = [new TestTrainer('New Stadium', TrainerType.STADIUM)];
      store.dispatch(new PlayCardAction(1, 0, board));
      expect(current().discard.cards).toEqual([old]);
    });

    it('Should allow only one stadium per turn', () => {
      player.hand.cards = [
        new TestTrainer('Stadium A', TrainerType.STADIUM),
        new TestTrainer('Stadium B', TrainerType.STADIUM)
      ];
      store.dispatch(new PlayCardAction(1, 0, board));
      expect(dispatchError(store, new PlayCardAction(1, 0, board))).toBe(GameMessage.STADIUM_ALREADY_PLAYED);
    });

    it('Should not play a stadium with the same name as the one in play', () => {
      state.players[1].stadium.cards = [new TestTrainer('Stadium A', TrainerType.STADIUM)];
      player.hand.cards = [new TestTrainer('Stadium A', TrainerType.STADIUM)];
      expect(dispatchError(store, new PlayCardAction(1, 0, board)))
        .toBe(GameMessage.SAME_STADIUM_ALREADY_IN_PLAY);
      expect(current().stadiumPlayedTurn).toBe(0);
    });
  });

  describe('Tool', () => {
    it('Should attach tool to a pokemon', () => {
      const tool = new TestTrainer('Tool', TrainerType.TOOL);
      player.hand.cards = [tool];
      store.dispatch(new PlayCardAction(1, 0, active));
      expect(current().active.trainers.cards).toEqual([tool]);
      expect(tool.effects.some(e => e instanceof TrainerEffect)).toBe(true);
      expect(logs()).toContain(GameLog.LOG_PLAYER_PLAYS_TOOL);
    });

    it('Should throw INVALID_TARGET when tool has no pokemon target', () => {
      player.hand.cards = [new TestTrainer('Tool', TrainerType.TOOL)];
      expect(dispatchError(store, new PlayCardAction(1, 0, board))).toBe(GameMessage.INVALID_TARGET);
      expect(dispatchError(store, new PlayCardAction(1, 0, bench0))).toBe(GameMessage.INVALID_TARGET);
    });

    it('Should not attach a tool to the opponent\'s Pokemon', () => {
      player.hand.cards = [new TestTrainer('Tool', TrainerType.TOOL)];
      expect(dispatchError(store, new PlayCardAction(1, 0, oppActive))).toBe(GameMessage.INVALID_TARGET);
      expect(dispatchError(store, new PlayCardAction(1, 0, anyActive))).toBe(GameMessage.INVALID_TARGET);
      expect(store.state.players[1].active.trainers.cards).toEqual([]);
      expect(current().hand.cards.length).toBe(1);
    });

    it('Should not attach a second tool', () => {
      player.active.trainers.cards = [new TestTrainer('Tool', TrainerType.TOOL)];
      player.hand.cards = [new TestTrainer('Tool 2', TrainerType.TOOL)];
      expect(dispatchError(store, new PlayCardAction(1, 0, active)))
        .toBe(GameMessage.POKEMON_TOOL_ALREADY_ATTACHED);
    });
  });

  describe('Item', () => {
    it('Should play item and discard it', () => {
      const item = new TestTrainer('Item', TrainerType.ITEM);
      player.hand.cards = [item];
      store.dispatch(new PlayCardAction(1, 0, board));
      expect(current().hand.cards).toEqual([]);
      expect(current().discard.cards).toEqual([item]);
      const effect = item.effects.find(e => e instanceof TrainerEffect) as TrainerEffect;
      expect(effect.target).toBeUndefined();
      expect(logs()).toContain(GameLog.LOG_PLAYER_PLAYS_ITEM);
    });

    it('Should pass the selected pokemon slot as the item target', () => {
      const item = new TestTrainer('Item', TrainerType.ITEM);
      player.hand.cards = [item];
      const top: CardTarget = { player: PlayerType.TOP_PLAYER, slot: SlotType.ACTIVE, index: 0 };
      store.dispatch(new PlayCardAction(1, 0, top));
      const effect = item.effects.find(e => e instanceof TrainerEffect) as TrainerEffect;
      expect(effect.target).toBe(store.state.players[1].active);
    });
  });

});
