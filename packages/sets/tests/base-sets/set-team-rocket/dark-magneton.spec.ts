import {
  AttachEnergyPrompt,
  AttackAction,
  CardType,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { DarkMagneton } from '../../../src/base-sets/set-team-rocket/dark-magneton';
import { RainbowEnergy } from '../../../src/base-sets/set-team-rocket/rainbow-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Dark Magneton TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new DarkMagneton()],
      [CardType.LIGHTNING, CardType.LIGHTNING]
    );
  });

  // Sonicboom (20) - Don't apply Weakness and Resistance for this attack.
  it('Should use Sonicboom without Weakness', () => {
    const { opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as TestPokemon).weakness = [{ type: CardType.LIGHTNING }];

    sim.dispatch(new AttackAction(1, 'Sonicboom'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Sonicboom without Resistance', () => {
    const { opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as TestPokemon).resistance = [{ type: CardType.LIGHTNING, value: -30 }];

    sim.dispatch(new AttackAction(1, 'Sonicboom'));

    expect(opponent.active.damage).toEqual(20);
  });

  // Magnetic Lines (30) - If the Defending Pokémon has any basic Energy cards attached to it, choose 1 of them. If
  // your opponent has any Benched Pokémon, choose 1 of them and attach that Energy card to it.
  it('Should use Magnetic Lines to move a basic Energy card to a Benched Pokémon', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestPokemon()], [CardType.WATER, CardType.FIRE]);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[1] = TestUtils.pokemonSlot([new TestPokemon()]);
    const [water, fire] = opponent.active.energies.cards;

    sim.dispatch(new AttackAction(1, 'Magnetic Lines'));

    const prompt = prompts[0] as AttachEnergyPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Attach energy',
      playerId: player.id,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.BENCH],
      options: jasmine.objectContaining({ min: 1, max: 1 }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [{ to: TestUtils.target(sim, opponent.bench[1]), card: fire }]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.active.energies.cards).toEqual([water]);
    expect(opponent.bench[1].energies.cards).toEqual([fire]);
    expect(opponent.bench[0].energies.cards).toEqual([]);
  });

  it('Should use Magnetic Lines without opponent\'s Benched Pokémon', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestPokemon()], [CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Magnetic Lines'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.active.energies.cards.length).toEqual(1);
  });

  it('Should use Magnetic Lines without basic Energy on the Defending Pokémon', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    opponent.active.energies.cards = [new RainbowEnergy()];
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Magnetic Lines'));

    expect(prompts.length).toEqual(0);
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.active.energies.cards.length).toEqual(1);
  });
});
