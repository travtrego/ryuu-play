import {
  AttackAction,
  CardType,
  GameMessage,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
  SpecialCondition,
} from '@ptcg/common';

import { Cacturne } from '../../../src/ex-sets/set-sandstorm/cacturne';
import { Kabuto } from '../../../src/ex-sets/set-sandstorm/kabuto';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Cacturne SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Cacturne()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  // Poison Payback - If Cacturne is your Active Pokémon and is damaged by an opponent's attack (even if Cacturne is
  // Knocked Out), the Attacking Pokémon is now Poisoned.
  it('Should poison the Attacking Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActivePlayer(sim, opponent);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
  });

  it('Should not poison the Attacking Pokémon when Poison Payback is blocked', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);
    TestUtils.setActivePlayer(sim, opponent);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Feint Attack - Choose 1 of your opponent's Pokémon. This attack does 40 damage to that Pokémon. This attack's
  // damage isn't affected by Weakness, Resistance, Poké-Powers, Poké-Bodies or any other effects on that Pokémon.
  it('Should use Feint Attack on a Benched Pokémon', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Feint Attack'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.ACTIVE, SlotType.BENCH],
      options: jasmine.objectContaining({ allowCancel: false })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.bench[0].damage).toEqual(40);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Feint Attack on the Defending Pokémon ignoring Weakness', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    const defending = new TestPokemon();
    defending.weakness = [{ type: CardType.GRASS }];
    TestUtils.setDefending(sim, [defending]);

    sim.dispatch(new AttackAction(1, 'Feint Attack'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.active]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Feint Attack ignoring Resistance', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    const defending = new TestPokemon();
    defending.resistance = [{ type: CardType.GRASS, value: -30 }];
    TestUtils.setDefending(sim, [defending]);

    sim.dispatch(new AttackAction(1, 'Feint Attack'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.active]));

    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Feint Attack ignoring Poké-Bodies (Kabuto\'s Exoskeleton)', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new Kabuto()]);

    sim.dispatch(new AttackAction(1, 'Feint Attack'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.active]));

    expect(opponent.active.damage).toEqual(40);
  });
});
