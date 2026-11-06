import {
  AttachEnergyPrompt,
  AttackAction,
  CardAssign,
  CardType,
  EnergyType,
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
  SuperType,
  UseAbilityAction,
} from '@ptcg/common';

import { Blastoise } from '../../../src/base-sets/set-base/blastoise';
import { FireEnergy } from '../../../src/base-sets/set-base/fire-energy';
import { WaterEnergy } from '../../../src/base-sets/set-base/water-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

function waterPokemon(): TestPokemon {
  const pokemon = new TestPokemon();
  pokemon.cardTypes = [CardType.WATER];
  return pokemon;
}

describe('Blastoise BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Blastoise()],
      [CardType.WATER, CardType.WATER, CardType.WATER],
    );
  });

  // Rain Dance - As often as you like during your turn (before your attack), you may attach 1 W Energy card to
  // 1 of your W Pokémon. (This doesn't use up your 1 Energy card attachment for the turn.) This power can't be
  // used if Blastoise is Asleep, Confused, or Paralyzed.
  it('Should use Rain Dance - attach Water Energy to a benched Water Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    const water = new WaterEnergy();
    player.hand.cards = [water];
    player.bench[0] = TestUtils.pokemonSlot([waterPokemon()]);

    sim.dispatch(new UseAbilityAction(1, 'Rain Dance', TestUtils.target(sim, player.active)));

    const prompt = TestUtils.lastPrompt(sim) as AttachEnergyPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Attach energy',
      playerId: player.id,
      message: GameMessage.ATTACH_ENERGY_CARDS,
      cardList: player.hand,
      filter: {
        superType: SuperType.ENERGY,
        energyType: EnergyType.BASIC,
        name: 'Water Energy',
      },
      options: jasmine.objectContaining({ allowCancel: true })
    }));

    const cardAssigns: CardAssign[] = [{ to: TestUtils.target(sim, player.bench[0]), card: water }];
    sim.dispatch(new ResolvePromptAction(prompt.id, cardAssigns));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.bench[0].energies.cards).toEqual([water]);
    expect(player.hand.cards).toEqual([]);
  });

  it('Should use Rain Dance - as often as you like', () => {
    const { player } = TestUtils.getAll(sim);
    const water1 = new WaterEnergy();
    const water2 = new WaterEnergy();
    player.hand.cards = [water1, water2];
    const target = TestUtils.target(sim, player.active);

    sim.dispatch(new UseAbilityAction(1, 'Rain Dance', target));
    let prompt = TestUtils.lastPrompt(sim) as AttachEnergyPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [{ to: target, card: water1 }]));

    sim.dispatch(new UseAbilityAction(1, 'Rain Dance', target));
    prompt = TestUtils.lastPrompt(sim) as AttachEnergyPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [{ to: target, card: water2 }]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.energies.cards.slice(3)).toEqual([water1, water2]);
    expect(player.hand.cards).toEqual([]);
  });

  it('Should use Rain Dance - does not use up the Energy attachment for the turn', () => {
    const { player } = TestUtils.getAll(sim);
    const water1 = new WaterEnergy();
    const water2 = new WaterEnergy();
    player.hand.cards = [water1, water2];
    // No Energy card has been attached manually this turn yet (the test state starts at turn 0)
    player.energyPlayedTurn = -1;
    const target = TestUtils.target(sim, player.active);

    sim.dispatch(new UseAbilityAction(1, 'Rain Dance', target));
    const prompt = TestUtils.lastPrompt(sim) as AttachEnergyPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [{ to: target, card: water1 }]));

    // Manual attachment is still available
    sim.dispatch(new PlayCardAction(1, 0, target));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.energies.cards.slice(3)).toEqual([water1, water2]);
    expect(player.hand.cards).toEqual([]);
  });

  it('Should not use Rain Dance without Water Energy in hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [new FireEnergy()];

    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Rain Dance', TestUtils.target(sim, player.active)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_USE_POWER);
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
  });

  // BUG: Rain Dance lets the Water Energy be attached to non-Water Pokémon (prompt has no blockedTo for them)
  it('Should not use Rain Dance to attach Water Energy to a non-Water Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    const water = new WaterEnergy();
    player.hand.cards = [water];
    const nonWater = new TestPokemon();
    nonWater.cardTypes = [CardType.FIRE];
    player.bench[0] = TestUtils.pokemonSlot([nonWater]);

    sim.dispatch(new UseAbilityAction(1, 'Rain Dance', TestUtils.target(sim, player.active)));
    const prompt = TestUtils.lastPrompt(sim) as AttachEnergyPrompt;

    const cardAssigns: CardAssign[] = [{ to: TestUtils.target(sim, player.bench[0]), card: water }];
    expect(prompt.validate(cardAssigns)).toBeFalse();
  });

  [
    { name: 'Asleep', condition: SpecialCondition.ASLEEP },
    { name: 'Confused', condition: SpecialCondition.CONFUSED },
    { name: 'Paralyzed', condition: SpecialCondition.PARALYZED },
  ].forEach(({ name, condition }) => {
    it(`Should not use Rain Dance when Blastoise is ${name}`, () => {
      const { player } = TestUtils.getAll(sim);
      player.hand.cards = [new WaterEnergy()];
      player.active.addSpecialCondition(condition);

      let message = '';
      try {
        sim.dispatch(new UseAbilityAction(1, 'Rain Dance', TestUtils.target(sim, player.active)));
      } catch (error) {
        message = TestUtils.getErrorMessage(error);
      }

      expect(message).toEqual(GameMessage.CANNOT_USE_POWER);
      expect(player.hand.cards.length).toEqual(1);
    });
  });

  // Hydro Pump (40+) - Does 40 damage plus 10 more damage for each W Energy attached to Blastoise but not used to
  // pay for this attack's Energy cost. Extra W Energy after the 2nd doesn't count.
  it('Should use Hydro Pump - no extra Water Energy', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Hydro Pump'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Hydro Pump - 1 extra Water Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Blastoise()], [CardType.WATER, CardType.WATER, CardType.WATER, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Hydro Pump'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
  });

  it('Should use Hydro Pump - extra Water Energy after the 2nd does not count', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Blastoise()], [
      CardType.WATER, CardType.WATER, CardType.WATER, CardType.WATER, CardType.WATER, CardType.WATER
    ]);

    sim.dispatch(new AttackAction(1, 'Hydro Pump'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Hydro Pump - extra non-Water Energy does not count', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Blastoise()], [
      CardType.WATER, CardType.WATER, CardType.WATER, CardType.FIRE, CardType.COLORLESS
    ]);

    sim.dispatch(new AttackAction(1, 'Hydro Pump'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });

});
