import {
  AttachEnergyPrompt,
  AttackAction,
  CardAssign,
  CardType,
  ChooseEnergyPrompt,
  EnergyType,
  GameMessage,
  PassTurnAction,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
  SpecialCondition,
  SuperType,
  UseAbilityAction,
} from '@ptcg/common';

import { Blaziken } from '../../../src/ex-sets/set-ruby-and-sapphire/blaziken';
import { FireEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/fire-energy';
import { WaterEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/water-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Blaziken RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Blaziken()], [CardType.FIRE, CardType.COLORLESS, CardType.COLORLESS]);
  });

  function useFirestarter(): string {
    const { player } = TestUtils.getAll(sim);
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Firestarter', TestUtils.target(sim, player.active)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Firestarter - Once during your turn (before your attack), you may attach a R Energy card from your discard pile
  // to 1 of your Benched Pokémon. This power can't be used if Blaziken is affected by a Special Condition.
  it('Should use Firestarter - attach Fire Energy from discard', () => {
    const { player } = TestUtils.getAll(sim);
    const fire = new FireEnergy();
    player.discard.cards = [fire, new WaterEnergy()];
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    expect(useFirestarter()).toEqual('');

    const prompt = TestUtils.lastPrompt(sim) as AttachEnergyPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Attach energy',
      playerId: player.id,
      message: GameMessage.ATTACH_ENERGY_TO_BENCH,
      cardList: player.discard,
      playerType: PlayerType.BOTTOM_PLAYER,
      slots: [SlotType.BENCH],
      filter: { superType: SuperType.ENERGY, energyType: EnergyType.BASIC, name: 'Fire Energy' },
      options: jasmine.objectContaining({ min: 1, max: 1, allowCancel: true }),
    }));

    const assign: CardAssign[] = [{ to: TestUtils.target(sim, player.bench[0]), card: fire }];
    sim.dispatch(new ResolvePromptAction(prompt.id, assign));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.bench[0].energies.cards).toEqual([fire]);
    expect(player.discard.cards.length).toEqual(1);
  });

  it('Should use Firestarter - once per turn', () => {
    const { player } = TestUtils.getAll(sim);
    const fire = new FireEnergy();
    player.discard.cards = [fire, new FireEnergy()];
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    useFirestarter();
    const prompt = TestUtils.lastPrompt(sim) as AttachEnergyPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [{ to: TestUtils.target(sim, player.bench[0]), card: fire }]));

    expect(useFirestarter()).toEqual(GameMessage.POWER_ALREADY_USED);
  });

  it('Should use Firestarter - can be used again next turn', () => {
    const { player } = TestUtils.getAll(sim);
    const fire = new FireEnergy();
    player.discard.cards = [fire, new FireEnergy()];
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    useFirestarter();
    let prompt = TestUtils.lastPrompt(sim) as AttachEnergyPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [{ to: TestUtils.target(sim, player.bench[0]), card: fire }]));

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new PassTurnAction(2));

    expect(useFirestarter()).toEqual('');
    prompt = TestUtils.lastPrompt(sim) as AttachEnergyPrompt;
    expect(prompt.type).toEqual('Attach energy');
  });

  it('Should use Firestarter - canceled does not use the power', () => {
    const { player } = TestUtils.getAll(sim);
    player.discard.cards = [new FireEnergy()];
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    useFirestarter();
    const prompt = TestUtils.lastPrompt(sim) as AttachEnergyPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, null));

    expect(player.bench[0].energies.cards).toEqual([]);
    expect(useFirestarter()).toEqual('');
  });

  it('Should use Firestarter - no Fire Energy in discard', () => {
    const { player } = TestUtils.getAll(sim);
    player.discard.cards = [new WaterEnergy()];
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    expect(useFirestarter()).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  it('Should use Firestarter - no Benched Pokemon', () => {
    const { player } = TestUtils.getAll(sim);
    player.discard.cards = [new FireEnergy()];

    expect(useFirestarter()).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  it('Should use Firestarter - affected by Special Condition', () => {
    const { player } = TestUtils.getAll(sim);
    player.discard.cards = [new FireEnergy()];
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.active.addSpecialCondition(SpecialCondition.POISONED);

    expect(useFirestarter()).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  it('Should use Firestarter - power blocked', () => {
    const { player } = TestUtils.getAll(sim);
    player.discard.cards = [new FireEnergy()];
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    expect(useFirestarter()).toEqual(GameMessage.BLOCKED_BY_ABILITY);
  });

  // Fire Stream (50) - Discard a R Energy card attached to Blaziken. If you do, this attack does 10 damage to each
  // of your opponent's Benched Pokémon. (Don't apply Weakness and Resistance for Benched Pokémon.)
  it('Should use Fire Stream - discard Fire Energy', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const benched = new TestPokemon();
    benched.weakness = [{ type: CardType.FIRE }];
    opponent.bench[0] = TestUtils.pokemonSlot([benched]);
    opponent.bench[1] = TestUtils.pokemonSlot([new TestPokemon()]);
    const fire = player.active.energies.cards[0];

    sim.dispatch(new AttackAction(1, 'Fire Stream'));

    const prompt = TestUtils.lastPrompt(sim) as ChooseEnergyPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose energy',
      playerId: player.id,
      message: GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
      cost: [CardType.FIRE],
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, prompt.energy.filter(e => e.card === fire)));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
    expect(opponent.bench[0].damage).toEqual(10);
    expect(opponent.bench[1].damage).toEqual(10);
    expect(player.active.energies.cards.length).toEqual(2);
    expect(player.discard.cards).toEqual([fire]);
  });

  it('Should use Fire Stream - canceled, no bench damage', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Fire Stream'));

    const prompt = TestUtils.lastPrompt(sim) as ChooseEnergyPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, null));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
    expect(opponent.bench[0].damage).toEqual(0);
    expect(player.active.energies.cards.length).toEqual(3);
  });

});
