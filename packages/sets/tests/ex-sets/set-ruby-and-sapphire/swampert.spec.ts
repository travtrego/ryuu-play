import {
  AttachEnergyPrompt,
  AttackAction,
  CardType,
  EnergyType,
  GameMessage,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
  SpecialCondition,
  SuperType,
  UseAbilityAction,
} from '@ptcg/common';

import { FireEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/fire-energy';
import { Swampert } from '../../../src/ex-sets/set-ruby-and-sapphire/swampert';
import { WaterEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/water-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Swampert RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Swampert()],
      [CardType.WATER, CardType.WATER, CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  function useWaterCall(): string {
    const { player } = TestUtils.getAll(sim);
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Water Call', TestUtils.target(sim, player.active)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Water Call - Once during your turn (before your attack), you may attach a W Energy card from your hand to your
  // Active Pokémon. This power can't be used if Swampert is affected by a Special Condition.
  it('Should use Water Call - prompt shows Water Energy from hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [new WaterEnergy()];

    expect(useWaterCall()).toEqual('');

    const prompt = TestUtils.lastPrompt(sim) as AttachEnergyPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Attach energy',
      playerId: player.id,
      cardList: player.hand,
      playerType: PlayerType.BOTTOM_PLAYER,
      slots: [SlotType.ACTIVE],
      filter: { superType: SuperType.ENERGY, energyType: EnergyType.BASIC, name: 'Water Energy' },
    }));
  });

  it('Should use Water Call - attach Water Energy from hand to the Active Pokemon', () => {
    const { player } = TestUtils.getAll(sim);
    const water = new WaterEnergy();
    player.hand.cards = [water];
    player.bench[0] = player.active;
    player.active = TestUtils.pokemonSlot([new TestPokemon()]);

    const target = TestUtils.target(sim, player.bench[0]);
    sim.dispatch(new UseAbilityAction(1, 'Water Call', target));
    const prompt = TestUtils.lastPrompt(sim) as AttachEnergyPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [{ to: TestUtils.target(sim, player.active), card: water }]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.energies.cards).toEqual([water]);
    expect(player.hand.cards).toEqual([]);
  });

  it('Should use Water Call - once per turn', () => {
    const { player } = TestUtils.getAll(sim);
    const water = new WaterEnergy();
    player.hand.cards = [water, new WaterEnergy()];

    useWaterCall();
    const prompt = TestUtils.lastPrompt(sim) as AttachEnergyPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [{ to: TestUtils.target(sim, player.active), card: water }]));

    expect(useWaterCall()).toEqual(GameMessage.POWER_ALREADY_USED);
  });

  it('Should use Water Call - no Water Energy in hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [new FireEnergy()];

    expect(useWaterCall()).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  it('Should use Water Call - affected by Special Condition', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [new WaterEnergy()];
    player.active.addSpecialCondition(SpecialCondition.CONFUSED);

    expect(useWaterCall()).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  it('Should use Water Call - power blocked', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [new WaterEnergy()];
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    expect(useWaterCall()).toEqual(GameMessage.BLOCKED_BY_ABILITY);
  });

  // Hypno Splash (50) - The Defending Pokémon is now Asleep.
  it('Should use Hypno Splash', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Hypno Splash'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
  });

});
