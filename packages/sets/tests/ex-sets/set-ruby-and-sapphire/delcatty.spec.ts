import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  GameMessage,
  PassTurnAction,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
  SuperType,
  UseAbilityAction,
} from '@ptcg/common';

import { Delcatty } from '../../../src/ex-sets/set-ruby-and-sapphire/delcatty';
import { TestEnergy } from '../../test-cards/test-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Delcatty RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Delcatty()], [CardType.COLORLESS]);
  });

  function useEnergyDraw(): string {
    const { player } = TestUtils.getAll(sim);
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Energy Draw', TestUtils.target(sim, player.active)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Energy Draw - Once during your turn (before your attack), you may discard 1 Energy card from your hand. Then
  // draw up to 3 cards from your deck. This power can't be used if Delcatty is affected by a Special Condition.
  it('Should use Energy Draw - discard Energy and draw 3 cards', () => {
    const { player } = TestUtils.getAll(sim);
    const energy = new TestEnergy(CardType.WATER);
    player.hand.cards = [energy];
    const top3 = player.deck.cards.slice(0, 3);

    expect(useEnergyDraw()).toEqual('');

    let prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_DISCARD,
      cards: player.hand,
      filter: { superType: SuperType.ENERGY },
      options: jasmine.objectContaining({ min: 1, max: 1, allowCancel: true }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [energy]));

    prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      options: jasmine.objectContaining({ min: 0, max: 3 }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, prompt.cards.cards.slice()));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.discard.cards).toEqual([energy]);
    expect(player.hand.cards).toEqual(top3);
    expect(player.deck.cards.length).toEqual(47);
  });

  it('Should use Energy Draw - draw fewer than 3 cards', () => {
    const { player } = TestUtils.getAll(sim);
    const energy = new TestEnergy(CardType.WATER);
    player.hand.cards = [energy];

    useEnergyDraw();
    let prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [energy]));
    prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, prompt.cards.cards.slice(0, 1)));

    expect(player.hand.cards.length).toEqual(1);
    expect(player.deck.cards.length).toEqual(49);
  });

  it('Should use Energy Draw - once per turn', () => {
    const { player } = TestUtils.getAll(sim);
    const energy = new TestEnergy(CardType.WATER);
    player.hand.cards = [energy, new TestEnergy(CardType.WATER)];

    useEnergyDraw();
    let prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [energy]));
    prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, []));

    expect(useEnergyDraw()).toEqual(GameMessage.POWER_ALREADY_USED);
  });

  it('Should use Energy Draw - can be used again next turn', () => {
    const { player } = TestUtils.getAll(sim);
    const energy = new TestEnergy(CardType.WATER);
    player.hand.cards = [energy, new TestEnergy(CardType.WATER)];

    useEnergyDraw();
    let prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [energy]));
    prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, []));

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new PassTurnAction(2));

    expect(useEnergyDraw()).toEqual('');
  });

  it('Should use Energy Draw - canceled', () => {
    const { player } = TestUtils.getAll(sim);
    const energy = new TestEnergy(CardType.WATER);
    player.hand.cards = [energy];

    useEnergyDraw();
    const prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, null));

    expect(player.hand.cards).toEqual([energy]);
    expect(player.deck.cards.length).toEqual(50);
    expect(useEnergyDraw()).toEqual('');
  });

  it('Should use Energy Draw - no Energy in hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [new TestPokemon()];

    expect(useEnergyDraw()).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  it('Should use Energy Draw - affected by Special Condition', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [new TestEnergy(CardType.WATER)];
    player.active.addSpecialCondition(SpecialCondition.CONFUSED);

    expect(useEnergyDraw()).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  it('Should use Energy Draw - power blocked', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [new TestEnergy(CardType.WATER)];
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    expect(useEnergyDraw()).toEqual(GameMessage.BLOCKED_BY_ABILITY);
  });

  // Max Energy Source (10x) - Does 10 damage times the amount of Energy attached to all of your Active Pokémon.
  it('Should use Max Energy Source', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.energies.cards = TestUtils.makeEnergies([CardType.COLORLESS, CardType.FIRE, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Max Energy Source'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

});
