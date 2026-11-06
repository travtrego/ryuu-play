import {
  AttachEnergyPrompt,
  AttackAction,
  CardType,
  ChoosePrizePrompt,
  GameMessage,
  ResolvePromptAction,
  SelectPrompt,
  Simulator,
  SpecialCondition,
  UseAbilityAction,
} from '@ptcg/common';

import { Electrode } from '../../../src/base-sets/set-base/electrode';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

// index of Water in the Buzzap type selection
const WATER_OPTION = 4;

describe('Electrode BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Electrode()],
      [CardType.LIGHTNING, CardType.LIGHTNING, CardType.LIGHTNING],
    );
  });

  // Electric Shock (50) - Flip a coin. If tails, Electrode does 10 damage to itself.
  it('Should use Electric Shock - heads', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Electric Shock'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Electric Shock - tails', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Electric Shock'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
    expect(player.active.damage).toEqual(10);
  });

  // Buzzap - At any time during your turn (before your attack), you may Knock Out Electrode and attach it to 1 of
  // your other Pokémon. If you do, choose a type of Energy. Electrode is now an Energy card (instead of a Pokémon)
  // that provides 2 energy of that type. You can't use this power if Electrode is Asleep, Confused, or Paralyzed.
  function useBuzzapOnActive(): Electrode {
    const { player } = TestUtils.getAll(sim);
    const electrode = player.active.getPokemonCard() as Electrode;
    const waterAttacker = new TestPokemon();
    waterAttacker.attacks = [{ name: 'Water attack', cost: [CardType.WATER, CardType.WATER], damage: '30', text: '' }];
    TestUtils.setActive(sim, [waterAttacker]);
    player.bench[0] = TestUtils.pokemonSlot([electrode]);

    sim.dispatch(new UseAbilityAction(1, 'Buzzap', TestUtils.target(sim, player.bench[0])));

    // Choose type
    const select = TestUtils.lastPrompt(sim) as SelectPrompt;
    expect(select).toEqual(jasmine.objectContaining({
      type: 'Select',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TYPE,
    }));
    expect(select.values[WATER_OPTION]).toEqual(GameMessage.TYPE_WATER);
    sim.dispatch(new ResolvePromptAction(select.id, WATER_OPTION));

    // Choose Pokémon to attach to
    const attach = TestUtils.lastPrompt(sim) as AttachEnergyPrompt;
    expect(attach).toEqual(jasmine.objectContaining({
      type: 'Attach energy',
      playerId: player.id,
    }));
    sim.dispatch(new ResolvePromptAction(attach.id, [{ to: TestUtils.target(sim, player.active), card: electrode }]));
    return electrode;
  }

  it('Should use Buzzap - Electrode is attached and provides 2 Energy of the chosen type', () => {
    const { opponent, player } = TestUtils.getAll(sim);

    const electrode = useBuzzapOnActive();

    // Resolve the opponent's Prize card selection, if any
    const prize = TestUtils.lastPrompt(sim, opponent);
    if (prize !== undefined && prize.result === undefined) {
      sim.dispatch(new ResolvePromptAction(prize.id, opponent.prizes.slice(0, 1)));
    }

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.bench[0].pokemons.cards).toEqual([]);
    expect(player.active.energies.cards).toEqual([electrode]);

    // Electrode provides 2 Water Energy
    sim.dispatch(new AttackAction(1, 'Water attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  // BUG: Buzzap moves Electrode to the target before the Knock Out is processed, so the opponent takes no Prize
  it('Should use Buzzap - Electrode is Knocked Out and the opponent takes a Prize card', () => {
    const { opponent } = TestUtils.getAll(sim);

    useBuzzapOnActive();

    const prize = TestUtils.lastPrompt(sim, opponent) as ChoosePrizePrompt;
    expect(prize).toEqual(jasmine.objectContaining({ type: 'Choose prize', playerId: opponent.id }));
    sim.dispatch(new ResolvePromptAction(prize.id, opponent.prizes.slice(0, 1)));

    const { player } = TestUtils.getAll(sim);
    expect(opponent.getPrizeLeft()).toEqual(5);
    expect(player.bench[0].pokemons.cards).toEqual([]);
    expect(player.bench[0].damage).toEqual(0);
    expect(player.active.energies.cards.length).toEqual(1);
    expect(player.discard.cards.some(c => c instanceof Electrode)).toBeFalse();
  });

  it('Should use Buzzap from the Active spot - a new Active Pokémon is chosen', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    const electrode = player.active.getPokemonCard() as Electrode;
    const benched = new TestPokemon();
    player.bench[0] = TestUtils.pokemonSlot([benched]);

    sim.dispatch(new UseAbilityAction(1, 'Buzzap', TestUtils.target(sim, player.active)));
    const select = TestUtils.lastPrompt(sim) as SelectPrompt;
    sim.dispatch(new ResolvePromptAction(select.id, WATER_OPTION));
    const attach = TestUtils.lastPrompt(sim) as AttachEnergyPrompt;
    sim.dispatch(new ResolvePromptAction(attach.id, [{ to: TestUtils.target(sim, player.bench[0]), card: electrode }]));

    // Opponent takes a Prize, player promotes the benched Pokémon
    const prize = TestUtils.lastPrompt(sim, opponent) as ChoosePrizePrompt;
    sim.dispatch(new ResolvePromptAction(prize.id, opponent.prizes.slice(0, 1)));
    const choose = TestUtils.lastPrompt(sim, player);
    expect(choose).toEqual(jasmine.objectContaining({ type: 'Choose pokemon', playerId: player.id }));
    sim.dispatch(new ResolvePromptAction(choose!.id, [TestUtils.getAll(sim).player.bench[0]]));

    const after = TestUtils.getAll(sim);
    expect(TestUtils.isPlayerTurn(sim, after.player)).toBeTrue();
    expect(after.opponent.getPrizeLeft()).toEqual(5);
    expect(after.player.active.getPokemonCard()).toBe(benched);
    expect(after.player.active.energies.cards.map(c => c.fullName)).toEqual([electrode.fullName]);
    // The 3 Lightning Energy attached to Electrode were discarded with it
    expect(after.player.discard.cards.length).toEqual(3);
  });

  it('Should not use Buzzap without another Pokémon in play', () => {
    const { player } = TestUtils.getAll(sim);

    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Buzzap', TestUtils.target(sim, player.active)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_USE_POWER);
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
  });

  [
    { name: 'Asleep', condition: SpecialCondition.ASLEEP },
    { name: 'Confused', condition: SpecialCondition.CONFUSED },
    { name: 'Paralyzed', condition: SpecialCondition.PARALYZED },
  ].forEach(({ name, condition }) => {
    it(`Should not use Buzzap when Electrode is ${name}`, () => {
      const { player } = TestUtils.getAll(sim);
      player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
      player.active.addSpecialCondition(condition);

      let message = '';
      try {
        sim.dispatch(new UseAbilityAction(1, 'Buzzap', TestUtils.target(sim, player.active)));
      } catch (error) {
        message = TestUtils.getErrorMessage(error);
      }

      expect(message).toEqual(GameMessage.CANNOT_USE_POWER);
      expect(player.active.pokemons.cards.length).toEqual(1);
    });
  });

});
