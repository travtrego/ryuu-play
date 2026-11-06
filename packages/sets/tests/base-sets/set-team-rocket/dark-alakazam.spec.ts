import {
  AttackAction,
  CardType,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { DarkAlakazam } from '../../../src/base-sets/set-team-rocket/dark-alakazam';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Dark Alakazam TR', () => {
  let sim: Simulator;
  let alakazam: DarkAlakazam;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    alakazam = new DarkAlakazam();

    TestUtils.setActive(
      sim,
      [alakazam],
      [CardType.PSYCHIC, CardType.PSYCHIC, CardType.PSYCHIC]
    );
  });

  // Teleport Blast (30) - You may switch Dark Alakazam with 1 of your Benched Pokémon. (Do the damage before
  // switching the Pokémon.)
  it('Should use Teleport Blast and switch with a Benched Pokémon', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const benched = new TestPokemon();
    player.bench[0] = TestUtils.pokemonSlot([benched]);

    sim.dispatch(new AttackAction(1, 'Teleport Blast'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      playerType: PlayerType.BOTTOM_PLAYER,
      slots: [SlotType.BENCH],
      options: jasmine.objectContaining({ allowCancel: true }),
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(player.active.getPokemonCard()).toBe(benched);
    expect(player.bench[0].getPokemonCard()).toBe(alakazam);
    expect(player.bench[0].energies.cards.length).toEqual(3);
  });

  it('Should apply Weakness to Teleport Blast before switching', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    (opponent.active.getPokemonCard() as TestPokemon).weakness = [{ type: CardType.PSYCHIC }];

    sim.dispatch(new AttackAction(1, 'Teleport Blast'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.bench[0]]));

    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Teleport Blast without switching', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Teleport Blast'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(player.active.getPokemonCard()).toBe(alakazam);
  });

  it('Should use Teleport Blast without Benched Pokémon', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Teleport Blast'));

    expect(prompts.some(p => p.type === 'Choose pokemon')).toBeFalse();
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(player.active.getPokemonCard()).toBe(alakazam);
  });

  // Mind Shock (40) - Don't apply Weakness and Resistance for this attack.
  it('Should use Mind Shock without Weakness', () => {
    const { opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as TestPokemon).weakness = [{ type: CardType.PSYCHIC }];

    sim.dispatch(new AttackAction(1, 'Mind Shock'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Mind Shock without Resistance', () => {
    const { opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as TestPokemon).resistance = [{ type: CardType.PSYCHIC, value: -30 }];

    sim.dispatch(new AttackAction(1, 'Mind Shock'));

    expect(opponent.active.damage).toEqual(40);
  });
});
