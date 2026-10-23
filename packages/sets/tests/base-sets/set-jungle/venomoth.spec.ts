import {
  AttackAction,
  CardType,
  CheckPokemonTypeEffect,
  GameMessage,
  PokemonCard,
  ResolvePromptAction,
  SelectPrompt,
  Simulator,
  SpecialCondition,
  UseAbilityAction,
} from '@ptcg/common';

import { Venomoth } from '../../../src/base-sets/set-jungle/venomoth';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Venomoth JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Venomoth()],
      [CardType.GRASS, CardType.GRASS],
    );

    // Fire Defending Pokémon, weak to Fire
    const defending = new TestPokemon();
    defending.cardTypes = [CardType.FIRE];
    defending.weakness = [{ type: CardType.FIRE }];
    TestUtils.setDefending(sim, [defending]);
  });

  function useShift(venomothSlot = TestUtils.getAll(sim).player.active): SelectPrompt {
    sim.dispatch(new UseAbilityAction(1, 'Shift', TestUtils.target(sim, venomothSlot)));
    return TestUtils.lastPrompt(sim) as SelectPrompt;
  }

  function chooseType(select: SelectPrompt, message: GameMessage) {
    const index = select.values.indexOf(message);
    expect(index).not.toEqual(-1);
    sim.dispatch(new ResolvePromptAction(select.id, index));
  }

  function getTypes(slot = TestUtils.getAll(sim).player.active): CardType[] {
    const effect = new CheckPokemonTypeEffect(slot);
    sim.store.reduceEffect(sim.store.state, effect);
    return effect.cardTypes;
  }

  // Shift - Once during your turn (before your attack), you may change the type of Venomoth to the type of any other
  // Pokémon in play other than Colorless. This power can't be used if Venomoth is Asleep, Confused, or Paralyzed.
  it('Should use Shift - offers the types of other Pokémon in play except Colorless', () => {
    const { player } = TestUtils.getAll(sim);
    const water = new TestPokemon();
    water.cardTypes = [CardType.WATER];
    const colorless = new TestPokemon();
    colorless.cardTypes = [CardType.COLORLESS];
    player.bench[0] = TestUtils.pokemonSlot([water]);
    player.bench[1] = TestUtils.pokemonSlot([colorless]);

    const select = useShift();

    expect(select).toEqual(jasmine.objectContaining({
      type: 'Select',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TYPE,
      values: [GameMessage.TYPE_FIRE, GameMessage.TYPE_WATER],
    }));
  });

  it('Should use Shift - Venomoth becomes the chosen type', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    expect(getTypes()).toEqual([CardType.GRASS]);

    chooseType(useShift(), GameMessage.TYPE_FIRE);

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(getTypes()).toEqual([CardType.FIRE]);

    // Venom Powder now hits the Fire weakness
    TestUtils.setFlipResults(sim, [false]);
    sim.dispatch(new AttackAction(1, 'Venom Powder'));
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Shift and cancel', () => {
    const select = useShift();
    sim.dispatch(new ResolvePromptAction(select.id, null));

    expect(getTypes()).toEqual([CardType.GRASS]);
  });

  it('Should not use Shift when no other Pokémon in play has a non-Colorless type', () => {
    (TestUtils.getAll(sim).opponent.active.getPokemonCard() as PokemonCard).cardTypes = [CardType.COLORLESS];

    let message = '';
    try {
      useShift();
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  // BUG: Shift never records that it was used (SHIFT_MARKER is checked but never added), so it can be used repeatedly
  xit('Should use Shift only once per turn', () => {
    chooseType(useShift(), GameMessage.TYPE_FIRE);

    let message = '';
    try {
      useShift();
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.POWER_ALREADY_USED);
  });

  // BUG: Shift puts the type-change marker on the Active Pokémon instead of on Venomoth
  xit('Should use Shift from the Bench - the Benched Venomoth changes type, not the Active Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    const venomoth = player.active.getPokemonCard() as PokemonCard;
    const active = new TestPokemon();
    active.cardTypes = [CardType.WATER];
    TestUtils.setActive(sim, [active]);
    player.bench[0] = TestUtils.pokemonSlot([venomoth]);

    chooseType(useShift(player.bench[0]), GameMessage.TYPE_FIRE);

    expect(getTypes(player.bench[0])).toEqual([CardType.FIRE]);
    expect(getTypes(player.active)).toEqual([CardType.WATER]);
  });

  [SpecialCondition.ASLEEP, SpecialCondition.CONFUSED, SpecialCondition.PARALYZED].forEach(condition => {
    it(`Should not use Shift when Venomoth is ${condition}`, () => {
      const { player } = TestUtils.getAll(sim);
      player.active.addSpecialCondition(condition);

      let message = '';
      try {
        useShift();
      } catch (error) {
        message = TestUtils.getErrorMessage(error);
      }

      expect(message).toEqual(GameMessage.CANNOT_USE_POWER);
      expect(TestUtils.getAll(sim).prompts.length).toEqual(0);
    });
  });

  // Venom Powder (10) - Flip a coin. If heads, the Defending Pokémon is now Confused and Poisoned.
  it('Should use Venom Powder - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Venom Powder'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toContain(SpecialCondition.CONFUSED);
    expect(opponent.active.specialConditions).toContain(SpecialCondition.POISONED);
    expect(opponent.active.specialConditions.length).toEqual(2);
    // 10 damage + 10 Poison between turns
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Venom Powder - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Venom Powder'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([]);
    expect(opponent.active.damage).toEqual(10);
  });
});
