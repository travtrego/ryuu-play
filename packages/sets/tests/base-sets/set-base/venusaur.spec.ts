import {
  AttackAction,
  CardTransfer,
  CardType,
  GameMessage,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
  SpecialCondition,
  UseAbilityAction,
} from '@ptcg/common';

import { Venusaur } from '../../../src/base-sets/set-base/venusaur';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Venusaur BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Venusaur()],
      [CardType.GRASS, CardType.GRASS, CardType.GRASS, CardType.GRASS, CardType.FIRE],
    );
  });

  // Energy Trans - As often as you like during your turn (before your attack), you may take 1 G Energy card
  // attached to 1 of your Pokémon and attach it to a different one. This power can't be used if Venusaur is
  // Asleep, Confused, or Paralyzed.
  it('Should use Energy Trans to move Grass Energy to a Benched Pokémon', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new UseAbilityAction(1, 'Energy Trans', TestUtils.target(sim, player.active)));

    // Only Grass Energy may be moved
    const blockedMap = [{ source: TestUtils.target(sim, player.active), blocked: [4] }];

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Move energy',
      playerId: player.id,
      playerType: PlayerType.BOTTOM_PLAYER,
      slots: [SlotType.ACTIVE, SlotType.BENCH],
      message: GameMessage.MOVE_ENERGY_CARDS,
      options: jasmine.objectContaining({ allowCancel: true, blockedMap })
    }));

    const transfers: CardTransfer[] = [
      {
        from: TestUtils.target(sim, player.active),
        to: TestUtils.target(sim, player.bench[0]),
        card: player.active.energies.cards[0]
      },
      {
        from: TestUtils.target(sim, player.active),
        to: TestUtils.target(sim, player.bench[0]),
        card: player.active.energies.cards[1]
      },
    ];

    sim.dispatch(new ResolvePromptAction(prompts[0].id, transfers));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.energies.cards).toEqual(TestUtils.makeEnergies(
      [CardType.GRASS, CardType.GRASS, CardType.FIRE]));
    expect(player.bench[0].energies.cards).toEqual(TestUtils.makeEnergies([CardType.GRASS, CardType.GRASS]));
  });

  it('Should use Energy Trans to move Grass Energy between other Pokémon', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [CardType.GRASS]);
    player.bench[1] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new UseAbilityAction(1, 'Energy Trans', TestUtils.target(sim, player.active)));

    sim.dispatch(new ResolvePromptAction(prompts[0].id, [{
      from: TestUtils.target(sim, player.bench[0]),
      to: TestUtils.target(sim, player.bench[1]),
      card: player.bench[0].energies.cards[0]
    }]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.bench[0].energies.cards).toEqual([]);
    expect(player.bench[1].energies.cards).toEqual(TestUtils.makeEnergies([CardType.GRASS]));
  });

  it('Should use Energy Trans from the Bench', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const venusaur = player.active.getPokemonCard() as Venusaur;
    TestUtils.setActive(sim, [new TestPokemon()]);
    player.bench[0] = TestUtils.pokemonSlot([venusaur], [CardType.GRASS]);

    sim.dispatch(new UseAbilityAction(1, 'Energy Trans', TestUtils.target(sim, player.bench[0])));

    sim.dispatch(new ResolvePromptAction(prompts[0].id, [{
      from: TestUtils.target(sim, player.bench[0]),
      to: TestUtils.target(sim, player.active),
      card: player.bench[0].energies.cards[0]
    }]));

    expect(player.bench[0].energies.cards).toEqual([]);
    expect(player.active.energies.cards).toEqual(TestUtils.makeEnergies([CardType.GRASS]));
  });

  it('Should use Energy Trans and cancel', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new UseAbilityAction(1, 'Energy Trans', TestUtils.target(sim, player.active)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.energies.cards.length).toEqual(5);
    expect(player.bench[0].energies.cards).toEqual([]);
  });

  [SpecialCondition.ASLEEP, SpecialCondition.CONFUSED, SpecialCondition.PARALYZED].forEach(condition => {
    it(`Should not use Energy Trans when Venusaur is ${condition}`, () => {
      const { player, prompts } = TestUtils.getAll(sim);
      player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
      player.active.addSpecialCondition(condition);

      let message = '';
      try {
        sim.dispatch(new UseAbilityAction(1, 'Energy Trans', TestUtils.target(sim, player.active)));
      } catch (error) {
        message = TestUtils.getErrorMessage(error);
      }

      expect(message).toEqual(GameMessage.CANNOT_USE_POWER);
      expect(prompts.length).toEqual(0);
    });
  });

  it('Should use Energy Trans when Venusaur is Poisoned', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.active.addSpecialCondition(SpecialCondition.POISONED);

    sim.dispatch(new UseAbilityAction(1, 'Energy Trans', TestUtils.target(sim, player.active)));

    expect(prompts.length).toEqual(1);
    expect(prompts[0].type).toEqual('Move energy');
  });

  it('Should use Solarbeam', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Solarbeam'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });
});
