import {
  AttackAction,
  CardType,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { DarkVaporeon } from '../../../src/base-sets/set-team-rocket/dark-vaporeon';
import { RainbowEnergy } from '../../../src/base-sets/set-team-rocket/rainbow-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Dark Vaporeon TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new DarkVaporeon()],
      [CardType.WATER, CardType.WATER, CardType.WATER]
    );
  });

  // Bite (30)
  it('Should use Bite', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Bite'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  // Whirlpool (20) - If the Defending Pokémon has any Energy cards attached to it, choose 1 of them and discard it.
  it('Should use Whirlpool to discard an Energy card from the Defending Pokémon', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestPokemon()], [CardType.FIRE]);
    const rainbow = new RainbowEnergy();
    opponent.active.energies.cards.push(rainbow);
    const [fire] = opponent.active.energies.cards;

    sim.dispatch(new AttackAction(1, 'Whirlpool'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      options: jasmine.objectContaining({ min: 1, max: 1 }),
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [rainbow]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.energies.cards).toEqual([fire]);
    expect(opponent.discard.cards).toEqual([rainbow]);
  });

  it('Should use Whirlpool without Energy on the Defending Pokémon', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Whirlpool'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });
});
