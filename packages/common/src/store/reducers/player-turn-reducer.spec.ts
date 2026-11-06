import {
  AttackAction,
  PassTurnAction,
  RetreatAction,
  UseAbilityAction,
  UseStadiumAction,
  UseTrainerInPlayAction
} from '../actions/game-actions';
import { CardTarget, PlayerType, SlotType } from '../actions/play-card-action';
import { CardType, SpecialCondition, TrainerType } from '../card/card-types';
import { ChooseEnergyPrompt } from '../prompts/choose-energy-prompt';
import { GameLog, GameMessage } from '../../game-message';
import { GamePhase, State } from '../state/state';
import { PowerEffect, UseStadiumEffect, UseTrainerInPlayEffect } from '../effects/game-effects';
import { Store } from '../store';
import {
  TestBasic,
  TestEnergy,
  TestTrainer,
  createStore,
  createTurnState,
  dispatchError,
  power,
  resolve,
  unresolved
} from './reducer-test-utils';

describe('playerTurnReducer', () => {

  let state: State;
  let store: Store;

  const active: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
  const bench0: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 };
  const hand0: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.HAND, index: 0 };
  const discard0: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.DISCARD, index: 0 };

  function logs(): string[] {
    return store.state.logs.map(l => l.message);
  }

  beforeEach(() => {
    state = createTurnState(3);
    store = createStore(state);
  });

  it('Should ignore turn actions outside of the PLAYER_TURN phase', () => {
    state.phase = GamePhase.FINISHED;
    store.dispatch(new PassTurnAction(1));
    store.dispatch(new AttackAction(1, 'Test attack'));
    expect(store.state.activePlayer).toBe(0);
    expect(store.state.turn).toBe(3);
    expect(store.state.players[1].active.damage).toBe(0);
  });

  it('Should reject every turn action from the inactive player', () => {
    const actions = [
      new PassTurnAction(2),
      new RetreatAction(2, 0),
      new AttackAction(2, 'Test attack'),
      new UseAbilityAction(2, 'Power', active),
      new UseTrainerInPlayAction(2, active, 'Tool'),
      new UseStadiumAction(2)
    ];
    for (const action of actions) {
      expect(dispatchError(store, action)).toBe(GameMessage.NOT_YOUR_TURN);
    }
    expect(store.state.turn).toBe(3);
  });

  describe('PassTurnAction', () => {
    it('Should end the turn and start the opponent turn', () => {
      const supporter = new TestTrainer('Supporter', TrainerType.SUPPORTER);
      state.players[0].supporter.cards = [supporter];
      state.players[0].active.addSpecialCondition(SpecialCondition.PARALYZED);

      store.dispatch(new PassTurnAction(1));

      const s = store.state;
      expect(s.phase).toBe(GamePhase.PLAYER_TURN);
      expect(s.activePlayer).toBe(1);
      expect(s.turn).toBe(4);
      expect(s.players[1].hand.cards.length).toBe(1);
      expect(s.players[1].deck.cards.length).toBe(19);
      expect(s.players[0].supporter.cards.length).toBe(0);
      expect(s.players[0].discard.cards).toContain(supporter);
      expect(s.players[0].active.specialConditions).not.toContain(SpecialCondition.PARALYZED);
      expect(logs()).toContain(GameLog.LOG_PLAYER_ENDS_TURN);
      expect(logs()).toContain(GameLog.LOG_TURN);
    });

    it('Should finish the game when next player cannot draw', () => {
      state.players[1].deck.cards = [];
      store.dispatch(new PassTurnAction(1));
      expect(store.state.phase).toBe(GamePhase.FINISHED);
      expect(logs()).toContain(GameLog.LOG_PLAYER_NO_CARDS_IN_DECK);
    });
  });

  describe('RetreatAction', () => {
    it('Should switch active with benched pokemon for free retreat', () => {
      const activeCard = state.players[0].active.pokemons.cards[0];
      const benched = new TestBasic('Benched');
      state.players[0].bench[0].pokemons.cards = [benched];

      store.dispatch(new RetreatAction(1, 0));

      const player = store.state.players[0];
      expect(player.active.getPokemonCard()).toBe(benched);
      expect(player.bench[0].getPokemonCard()).toBe(activeCard);
      expect(player.retreatedTurn).toBe(3);
      expect(logs()).toContain(GameLog.LOG_PLAYER_RETREATS);
    });

    it('Should not retreat twice in the same turn', () => {
      state.players[0].bench[0].pokemons.cards = [new TestBasic('Benched')];
      store.dispatch(new RetreatAction(1, 0));
      expect(dispatchError(store, new RetreatAction(1, 0))).toBe(GameMessage.RETREAT_ALREADY_USED);
    });

    it('Should not retreat to an empty bench slot', () => {
      expect(dispatchError(store, new RetreatAction(1, 0))).toBe(GameMessage.INVALID_TARGET);
    });

    it('Should not retreat when asleep or paralyzed', () => {
      state.players[0].bench[0].pokemons.cards = [new TestBasic('Benched')];
      state.players[0].active.addSpecialCondition(SpecialCondition.ASLEEP);
      expect(dispatchError(store, new RetreatAction(1, 0))).toBe(GameMessage.BLOCKED_BY_SPECIAL_CONDITION);
    });

    it('Should require energy for the retreat cost', () => {
      const activeCard = state.players[0].active.pokemons.cards[0] as TestBasic;
      activeCard.retreat = [CardType.COLORLESS];
      state.players[0].bench[0].pokemons.cards = [new TestBasic('Benched')];
      expect(dispatchError(store, new RetreatAction(1, 0))).toBe(GameMessage.NOT_ENOUGH_ENERGY);
    });

    it('Should discard the chosen energy to pay the retreat cost', () => {
      const activeCard = state.players[0].active.pokemons.cards[0] as TestBasic;
      activeCard.retreat = [CardType.COLORLESS];
      const energy = new TestEnergy();
      state.players[0].active.energies.cards = [energy];
      const benched = new TestBasic('Benched');
      state.players[0].bench[0].pokemons.cards = [benched];

      store.dispatch(new RetreatAction(1, 0));
      const prompt = unresolved(store)[0];
      expect(prompt instanceof ChooseEnergyPrompt).toBe(true);

      resolve(store, prompt, [{ card: energy, provides: [CardType.COLORLESS], provideAmount: 1 }]);

      const player = store.state.players[0];
      expect(player.active.getPokemonCard()).toBe(benched);
      expect(player.discard.cards).toContain(energy);
      expect(player.bench[0].energies.cards.length).toBe(0);
    });
  });

  describe('AttackAction', () => {
    it('Should deal damage and pass the turn', () => {
      store.dispatch(new AttackAction(1, 'Test attack'));
      const s = store.state;
      expect(s.players[1].active.damage).toBe(10);
      expect(s.activePlayer).toBe(1);
      expect(s.turn).toBe(4);
      expect(logs()).toContain(GameLog.LOG_PLAYER_USES_ATTACK);
    });

    it('Should throw UNKNOWN_ATTACK without active pokemon', () => {
      state.players[0].active.pokemons.cards = [];
      expect(dispatchError(store, new AttackAction(1, 'Test attack'))).toBe(GameMessage.UNKNOWN_ATTACK);
    });

    it('Should throw UNKNOWN_ATTACK for an attack the pokemon does not have', () => {
      expect(dispatchError(store, new AttackAction(1, 'Hyper Beam'))).toBe(GameMessage.UNKNOWN_ATTACK);
      expect(store.state.players[1].active.damage).toBe(0);
    });

    it('Should not attack when paralyzed', () => {
      state.players[0].active.addSpecialCondition(SpecialCondition.PARALYZED);
      expect(dispatchError(store, new AttackAction(1, 'Test attack')))
        .toBe(GameMessage.BLOCKED_BY_SPECIAL_CONDITION);
    });
  });

  describe('UseAbilityAction', () => {
    let card: TestBasic;

    function usedPowers(c: TestBasic): string[] {
      return c.effects.filter(e => e instanceof PowerEffect).map(e => (e as PowerEffect).power.name);
    }

    beforeEach(() => {
      card = new TestBasic('Ability Pokemon', [
        power('In Play', { useWhenInPlay: true }),
        power('From Hand', { useFromHand: true }),
        power('From Discard', { useFromDiscard: true }),
        power('Passive')
      ]);
    });

    it('Should use the power of the active pokemon', () => {
      state.players[0].active.pokemons.cards = [card];
      store.dispatch(new UseAbilityAction(1, 'In Play', active));
      expect(usedPowers(card)).toEqual(['In Play']);
      expect(logs()).toContain(GameLog.LOG_PLAYER_USES_ABILITY);
    });

    it('Should use the power of a benched pokemon', () => {
      state.players[0].bench[0].pokemons.cards = [card];
      store.dispatch(new UseAbilityAction(1, 'In Play', bench0));
      expect(usedPowers(card)).toEqual(['In Play']);
    });

    it('Should use the power from hand', () => {
      state.players[0].hand.cards = [card];
      store.dispatch(new UseAbilityAction(1, 'From Hand', hand0));
      expect(usedPowers(card)).toEqual(['From Hand']);
    });

    it('Should use the power from discard', () => {
      state.players[0].discard.cards = [card];
      store.dispatch(new UseAbilityAction(1, 'From Discard', discard0));
      expect(usedPowers(card)).toEqual(['From Discard']);
    });

    it('Should throw CANNOT_USE_POWER when power is not usable from the slot', () => {
      state.players[0].active.pokemons.cards = [card];
      state.players[0].bench[0].pokemons.cards = [card];
      state.players[0].hand.cards = [card];
      state.players[0].discard.cards = [card];
      expect(dispatchError(store, new UseAbilityAction(1, 'Passive', active))).toBe(GameMessage.CANNOT_USE_POWER);
      expect(dispatchError(store, new UseAbilityAction(1, 'From Hand', bench0))).toBe(GameMessage.CANNOT_USE_POWER);
      expect(dispatchError(store, new UseAbilityAction(1, 'In Play', hand0))).toBe(GameMessage.CANNOT_USE_POWER);
      expect(dispatchError(store, new UseAbilityAction(1, 'In Play', discard0))).toBe(GameMessage.CANNOT_USE_POWER);
      expect(usedPowers(card)).toEqual([]);
    });

    it('Should throw UNKNOWN_POWER when pokemon has no such power', () => {
      expect(dispatchError(store, new UseAbilityAction(1, 'In Play', active))).toBe(GameMessage.UNKNOWN_POWER);
    });

    it('Should throw INVALID_TARGET when the target is not a pokemon', () => {
      state.players[0].active.pokemons.cards = [];
      state.players[0].hand.cards = [new TestEnergy()];
      state.players[0].discard.cards = [new TestEnergy()];
      const board: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BOARD, index: 0 };
      const badBench: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 7 };
      expect(dispatchError(store, new UseAbilityAction(1, 'In Play', active))).toBe(GameMessage.INVALID_TARGET);
      expect(dispatchError(store, new UseAbilityAction(1, 'In Play', bench0))).toBe(GameMessage.INVALID_TARGET);
      expect(dispatchError(store, new UseAbilityAction(1, 'In Play', badBench))).toBe(GameMessage.INVALID_TARGET);
      expect(dispatchError(store, new UseAbilityAction(1, 'From Hand', hand0))).toBe(GameMessage.INVALID_TARGET);
      expect(dispatchError(store, new UseAbilityAction(1, 'From Discard', discard0)))
        .toBe(GameMessage.INVALID_TARGET);
      expect(dispatchError(store, new UseAbilityAction(1, 'In Play', board))).toBe(GameMessage.INVALID_TARGET);
    });
  });

  describe('UseTrainerInPlayAction', () => {
    let tool: TestTrainer;

    beforeEach(() => {
      tool = new TestTrainer('Usable Tool', TrainerType.TOOL, true);
      state.players[0].active.trainers.cards = [tool];
    });

    function used(): number {
      return tool.effects.filter(e => e instanceof UseTrainerInPlayEffect).length;
    }

    it('Should use a trainer attached to the active pokemon', () => {
      store.dispatch(new UseTrainerInPlayAction(1, active, 'Usable Tool'));
      expect(used()).toBe(1);
      const effect = tool.effects.find(e => e instanceof UseTrainerInPlayEffect) as UseTrainerInPlayEffect;
      expect(effect.target).toBe(store.state.players[0].active);
    });

    it('Should use a trainer attached to a benched pokemon', () => {
      state.players[0].active.trainers.cards = [];
      state.players[0].bench[0].pokemons.cards = [new TestBasic()];
      state.players[0].bench[0].trainers.cards = [tool];
      store.dispatch(new UseTrainerInPlayAction(1, bench0, 'Usable Tool'));
      expect(used()).toBe(1);
    });

    it('Should only accept active or bench slots', () => {
      expect(dispatchError(store, new UseTrainerInPlayAction(1, hand0, 'Usable Tool')))
        .toBe(GameMessage.INVALID_TARGET);
      expect(used()).toBe(0);
    });

    it('Should throw UNKNOWN_POWER when trainer is missing or not usable', () => {
      expect(dispatchError(store, new UseTrainerInPlayAction(1, active, 'Other Tool')))
        .toBe(GameMessage.UNKNOWN_POWER);
      tool.useWhenInPlay = false;
      expect(dispatchError(store, new UseTrainerInPlayAction(1, active, 'Usable Tool')))
        .toBe(GameMessage.UNKNOWN_POWER);
      expect(used()).toBe(0);
    });
  });

  describe('UseStadiumAction', () => {
    it('Should throw NO_STADIUM_IN_PLAY without stadium', () => {
      expect(dispatchError(store, new UseStadiumAction(1))).toBe(GameMessage.NO_STADIUM_IN_PLAY);
    });

    it('Should throw CANNOT_USE_STADIUM for passive stadium', () => {
      state.players[0].stadium.cards = [new TestTrainer('Passive Stadium', TrainerType.STADIUM)];
      expect(dispatchError(store, new UseStadiumAction(1))).toBe(GameMessage.CANNOT_USE_STADIUM);
    });

    it('Should use stadium once per turn, also opponent\'s stadium', () => {
      const stadium = new TestTrainer('Usable Stadium', TrainerType.STADIUM, true);
      state.players[1].stadium.cards = [stadium];

      store.dispatch(new UseStadiumAction(1));
      expect(store.state.players[0].stadiumUsedTurn).toBe(3);
      expect(stadium.effects.filter(e => e instanceof UseStadiumEffect).length).toBe(1);
      expect(logs()).toContain(GameLog.LOG_PLAYER_USES_STADIUM);

      expect(dispatchError(store, new UseStadiumAction(1))).toBe(GameMessage.STADIUM_ALREADY_USED);
      expect(stadium.effects.filter(e => e instanceof UseStadiumEffect).length).toBe(1);
    });
  });

});
