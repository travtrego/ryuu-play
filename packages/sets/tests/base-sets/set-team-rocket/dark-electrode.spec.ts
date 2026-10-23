import {
  AttackAction,
  AttachEnergyPrompt,
  CardType,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { DarkElectrode } from '../../../src/base-sets/set-team-rocket/dark-electrode';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Dark Electrode TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new DarkElectrode()],
      [CardType.LIGHTNING, CardType.LIGHTNING, CardType.FIRE]
    );
  });

  // Rolling Tackle (10)
  it('Should use Rolling Tackle', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Rolling Tackle'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  // Energy Bomb (30) - Take all Energy cards attached to Dark Electrode and attach them to your Benched Pokémon (in
  // any way you choose). If you have no Benched Pokémon, discard all Energy cards attached to Dark Electrode.
  it('Should use Energy Bomb and move all Energy cards to Benched Pokémon', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.bench[1] = TestUtils.pokemonSlot([new TestPokemon()]);
    const [l1, l2, fire] = player.active.energies.cards;

    sim.dispatch(new AttackAction(1, 'Energy Bomb'));

    const prompt = prompts[0] as AttachEnergyPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Attach energy',
      playerId: player.id,
      playerType: PlayerType.BOTTOM_PLAYER,
      slots: [SlotType.BENCH],
      options: jasmine.objectContaining({ allowCancel: false, min: 3, max: 3 }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [
      { to: TestUtils.target(sim, player.bench[0]), card: l1 },
      { to: TestUtils.target(sim, player.bench[1]), card: l2 },
      { to: TestUtils.target(sim, player.bench[1]), card: fire },
    ]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(player.active.energies.cards).toEqual([]);
    expect(player.bench[0].energies.cards).toEqual([l1]);
    expect(player.bench[1].energies.cards).toEqual([l2, fire]);
    expect(player.discard.cards).toEqual([]);
  });

  it('Should use Energy Bomb and discard all Energy cards without Benched Pokémon', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const energies = player.active.energies.cards.slice();

    sim.dispatch(new AttackAction(1, 'Energy Bomb'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(player.active.energies.cards).toEqual([]);
    expect(player.discard.cards).toEqual(energies);
  });
});
