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

import { Gardevoir } from '../../../src/ex-sets/set-ruby-and-sapphire/gardevoir';
import { PsychicEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/psychic-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Gardevoir RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Gardevoir()], [CardType.PSYCHIC]);
  });

  function usePsyShadow(): string {
    const { player } = TestUtils.getAll(sim);
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Psy Shadow', TestUtils.target(sim, player.active)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Psy Shadow - Once during your turn (before your attack), you may search your deck for a P Energy card and
  // attach it to 1 of your Pokémon. Put 2 damage counters on that Pokémon. Shuffle your deck afterward. This power
  // can't be used if Gardevoir is affected by a Special Condition.
  it('Should use Psy Shadow - prompt', () => {
    const { player } = TestUtils.getAll(sim);
    player.deck.cards.push(new PsychicEnergy());

    expect(usePsyShadow()).toEqual('');

    const prompt = TestUtils.lastPrompt(sim) as AttachEnergyPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Attach energy',
      playerId: player.id,
      message: GameMessage.ATTACH_ENERGY_CARDS,
      cardList: player.deck,
      playerType: PlayerType.BOTTOM_PLAYER,
      slots: [SlotType.ACTIVE, SlotType.BENCH],
      filter: { superType: SuperType.ENERGY, energyType: EnergyType.BASIC, name: 'Psychic Energy' },
      options: jasmine.objectContaining({ min: 1, max: 1, allowCancel: true }),
    }));
  });

  it('Should use Psy Shadow - attach Psychic Energy from deck and put 2 damage counters', () => {
    const { player } = TestUtils.getAll(sim);
    const psychic = new PsychicEnergy();
    player.deck.cards.push(psychic);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    usePsyShadow();
    const prompt = TestUtils.lastPrompt(sim) as AttachEnergyPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [{ to: TestUtils.target(sim, player.bench[0]), card: psychic }]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.bench[0].energies.cards).toEqual([psychic]);
    expect(player.bench[0].damage).toEqual(20);
    expect(player.deck.cards).not.toContain(psychic);
  });

  it('Should use Psy Shadow - puts 2 damage counters on the chosen Pokemon', () => {
    const { player } = TestUtils.getAll(sim);
    const psychic = new PsychicEnergy();
    player.deck.cards.push(psychic);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    usePsyShadow();
    const prompt = TestUtils.lastPrompt(sim) as AttachEnergyPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [{ to: TestUtils.target(sim, player.bench[0]), card: psychic }]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.bench[0].damage).toEqual(20);
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Psy Shadow - once per turn', () => {
    const { player } = TestUtils.getAll(sim);
    const psychic = new PsychicEnergy();
    player.deck.cards.push(psychic, new PsychicEnergy());

    usePsyShadow();
    const prompt = TestUtils.lastPrompt(sim) as AttachEnergyPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [{ to: TestUtils.target(sim, player.active), card: psychic }]));

    expect(usePsyShadow()).toEqual(GameMessage.POWER_ALREADY_USED);
  });

  it('Should use Psy Shadow - empty deck', () => {
    const { player } = TestUtils.getAll(sim);
    player.deck.cards = [];

    expect(usePsyShadow()).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  it('Should use Psy Shadow - affected by Special Condition', () => {
    const { player } = TestUtils.getAll(sim);
    player.deck.cards.push(new PsychicEnergy());
    player.active.addSpecialCondition(SpecialCondition.ASLEEP);

    expect(usePsyShadow()).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  it('Should use Psy Shadow - power blocked', () => {
    const { player } = TestUtils.getAll(sim);
    player.deck.cards.push(new PsychicEnergy());
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    expect(usePsyShadow()).toEqual(GameMessage.BLOCKED_BY_ABILITY);
  });

  // Energy Burst (10x) - Does 10 damage times the total amount of Energy attached to Gardevoir and the Defending
  // Pokémon.
  it('Should use Energy Burst', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestPokemon()], [CardType.FIRE, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Energy Burst'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Energy Burst - Weakness applied', () => {
    const { opponent } = TestUtils.getAll(sim);
    const defending = new TestPokemon();
    defending.weakness = [{ type: CardType.PSYCHIC }];
    TestUtils.setDefending(sim, [defending], [CardType.FIRE]);

    sim.dispatch(new AttackAction(1, 'Energy Burst'));

    expect(opponent.active.damage).toEqual(40);
  });

});
