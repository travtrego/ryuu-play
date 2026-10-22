import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
  UseAbilityAction,
} from '@ptcg/common';

import { Charizard } from '../../../src/base-sets/set-base/charizard';
import { TestUtils } from '../../test-utils';

describe('Charizard BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Charizard()],
      [CardType.FIRE, CardType.FIRE, CardType.FIRE, CardType.FIRE],
    );
  });

  // Fire Spin (100) - Discard 2 Energy cards attached to Charizard in order to use this attack.
  it('Should use Fire Spin - discards 2 Energy cards', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Fire Spin'));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      cards: player.active.energies,
      options: jasmine.objectContaining({ min: 2, max: 2, allowCancel: false })
    }));

    const selected = player.active.energies.cards.slice(0, 2);
    sim.dispatch(new ResolvePromptAction(prompts[0].id, selected));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(100);
    expect(player.active.energies.cards).toEqual(TestUtils.makeEnergies([CardType.FIRE, CardType.FIRE]));
    expect(player.discard.cards).toEqual(selected);
  });

  // Energy Burn - As often as you like during your turn (before your attack), you may turn all Energy attached
  // to Charizard into R Energy for the rest of the turn. This power can't be used if Charizard is Asleep,
  // Confused, or Paralyzed.
  it('Should not use Fire Spin with non-Fire Energy without Energy Burn', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Charizard()], [CardType.WATER, CardType.WATER, CardType.WATER, CardType.WATER]);

    let message = '';
    try {
      sim.dispatch(new AttackAction(1, 'Fire Spin'));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.NOT_ENOUGH_ENERGY);
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
  });

  it('Should use Energy Burn - all Energy becomes Fire Energy', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Charizard()], [CardType.WATER, CardType.WATER, CardType.GRASS, CardType.COLORLESS]);

    sim.dispatch(new UseAbilityAction(1, 'Energy Burn', TestUtils.target(sim, player.active)));
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();

    sim.dispatch(new AttackAction(1, 'Fire Spin'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, player.active.energies.cards.slice(0, 2)));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(100);
  });

  it('Should use Energy Burn - more than once per turn', () => {
    const { player } = TestUtils.getAll(sim);
    const target = TestUtils.target(sim, player.active);

    sim.dispatch(new UseAbilityAction(1, 'Energy Burn', target));
    sim.dispatch(new UseAbilityAction(1, 'Energy Burn', target));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
  });

  it('Should use Energy Burn - only for the rest of the turn', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    const charizard = player.active.getPokemonCard() as Charizard;
    TestUtils.setActive(sim, [charizard], [CardType.WATER, CardType.WATER, CardType.WATER, CardType.WATER]);

    sim.dispatch(new UseAbilityAction(1, 'Energy Burn', TestUtils.target(sim, player.active)));
    expect(player.marker.hasMarker(charizard.ENERGY_BURN_MARKER, charizard)).toBeTrue();

    // Attack (ends our turn), then the opponent attacks (ends their turn)
    sim.dispatch(new AttackAction(1, 'Fire Spin'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, player.active.energies.cards.slice(0, 2)));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    sim.dispatch(new AttackAction(2, 'Test attack'));

    // Back on our turn, Energy Burn is no longer active
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.marker.hasMarker(charizard.ENERGY_BURN_MARKER, charizard)).toBeFalse();
  });

  [
    { name: 'Asleep', condition: SpecialCondition.ASLEEP },
    { name: 'Confused', condition: SpecialCondition.CONFUSED },
    { name: 'Paralyzed', condition: SpecialCondition.PARALYZED },
  ].forEach(({ name, condition }) => {
    it(`Should not use Energy Burn when Charizard is ${name}`, () => {
      const { player } = TestUtils.getAll(sim);
      player.active.addSpecialCondition(condition);

      let message = '';
      try {
        sim.dispatch(new UseAbilityAction(1, 'Energy Burn', TestUtils.target(sim, player.active)));
      } catch (error) {
        message = TestUtils.getErrorMessage(error);
      }

      expect(message).toEqual(GameMessage.CANNOT_USE_POWER);
      expect(player.marker.hasMarker('ENERGY_BURN_MARKER')).toBeFalse();
    });
  });

});
