import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  GameMessage,
  PassTurnAction,
  ResolvePromptAction,
  Simulator,
  UseAbilityAction,
} from '@ptcg/common';

import { Delcatty } from '../../../src/ex-sets/set-ruby-and-sapphire/delcatty';
import { RainbowEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/rainbow-energy';
import { Slaking } from '../../../src/ex-sets/set-ruby-and-sapphire/slaking';
import { TestEnergy } from '../../test-cards/test-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Slaking RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Slaking()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  function useEnergyDraw(clientId: number, slotOwnerIndex: number): string {
    const state = sim.store.state;
    const owner = state.players[slotOwnerIndex];
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(clientId, 'Energy Draw', TestUtils.target(sim, owner.bench[0], owner)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Lazy - As long as Slaking is your Active Pokémon, your opponent's Pokémon can't use any Poké-Powers.
  it('Should use Lazy - opponent can\'t use Poke-Powers', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new Delcatty()]);
    opponent.hand.cards = [new TestEnergy(CardType.WATER)];

    sim.dispatch(new PassTurnAction(1));

    expect(useEnergyDraw(2, 1)).toEqual(GameMessage.BLOCKED_BY_ABILITY);
  });

  it('Should use Lazy - not when Slaking is on the Bench', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = player.active;
    player.active = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[0] = TestUtils.pokemonSlot([new Delcatty()]);
    opponent.hand.cards = [new TestEnergy(CardType.WATER)];

    sim.dispatch(new PassTurnAction(1));

    expect(useEnergyDraw(2, 1)).toEqual('');
  });

  it('Should use Lazy - own Pokemon can use Poke-Powers', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new Delcatty()]);
    player.hand.cards = [new TestEnergy(CardType.WATER)];

    expect(useEnergyDraw(1, 0)).toEqual('');
  });

  // Critical Move (100) - Discard a basic Energy card attached to Slaking or this attack does nothing. Slaking can't
  // attack during your next turn.
  it('Should use Critical Move', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const energy = player.active.energies.cards[0];

    sim.dispatch(new AttackAction(1, 'Critical Move'));

    const prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_DISCARD,
      cards: player.active.energies,
      options: jasmine.objectContaining({ min: 1, max: 1, allowCancel: false }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [energy]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(100);
    expect(player.discard.cards).toEqual([energy]);
  });

  it('Should use Critical Move - can\'t attack during next turn', () => {
    const { player } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Critical Move'));
    let prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [player.active.energies.cards[0]]));
    sim.dispatch(new PassTurnAction(2));

    let message = '';
    try {
      sim.dispatch(new AttackAction(1, 'Critical Move'));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    expect(message).toEqual(GameMessage.BLOCKED_BY_EFFECT);
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();

    // The turn after, Slaking can attack again
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new AttackAction(1, 'Critical Move'));
    prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    expect(prompt.type).toEqual('Choose cards');
  });

  // OPEN RULES QUESTION: with no basic Energy attached the code throws NOT_ENOUGH_ENERGY (attack unusable) instead of letting the
  // attack resolve and do nothing.
  xit('Should use Critical Move - no basic Energy, attack does nothing', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.energies.cards = [new RainbowEnergy(), new RainbowEnergy(), new RainbowEnergy(), new RainbowEnergy()];

    sim.dispatch(new AttackAction(1, 'Critical Move'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

});
