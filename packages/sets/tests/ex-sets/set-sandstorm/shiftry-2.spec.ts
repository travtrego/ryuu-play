import {
  AttackAction,
  CardType,
  GameMessage,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { Kabuto } from '../../../src/ex-sets/set-sandstorm/kabuto';
import { Shiftry2 } from '../../../src/ex-sets/set-sandstorm/shiftry-2';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Shiftry SS-2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Shiftry2()],
      [CardType.GRASS, CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  // Feint Attack - Choose 1 of your opponent's Pokémon. This attack does 40 damage to that Pokémon. This attack's
  // damage isn't affected by Weakness, Resistance, Poké-Powers, Poké-Bodies, or any other effects on that Pokémon.
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

  // Slash (60)
  it('Should use Slash', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Slash'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });
});
