import {
  AttackAction,
  CardType,
  ChooseEnergyPrompt,
  GameMessage,
  PokemonCard,
  ResolvePromptAction,
  RetreatAction,
  Simulator,
} from '@ptcg/common';

import { Dodrio } from '../../../src/base-sets/set-jungle/dodrio';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Dodrio JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    // retreat is allowed once per turn; retreatedTurn starts at 0
    sim.store.state.turn = 1;

    TestUtils.setActive(
      sim,
      [new Dodrio()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  function setActiveWithRetreat(retreat: CardType[], energies: CardType[]) {
    const active = new TestPokemon();
    active.retreat = retreat;
    TestUtils.setActive(sim, [active], energies);
    return active;
  }

  // Retreat Aid - As long as Dodrio is Benched, pay C less to retreat your Active Pokémon.
  it('Should reduce the Retreat Cost by C while Dodrio is Benched', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    setActiveWithRetreat([CardType.COLORLESS, CardType.COLORLESS], [CardType.COLORLESS, CardType.COLORLESS]);
    player.bench[0] = TestUtils.pokemonSlot([new Dodrio()]);

    sim.dispatch(new RetreatAction(1, 0));

    const prompt = prompts[0] as ChooseEnergyPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose energy',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_SWITCH,
      cost: [CardType.COLORLESS],
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [prompt.energy[0]]));

    expect(player.active.getPokemonCard()).toEqual(jasmine.any(Dodrio));
    expect(player.bench[0].energies.cards.length).toEqual(1);
    expect(player.discard.cards.length).toEqual(1);
  });

  it('Should let the Active Pokémon retreat for free with Retreat Cost C', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const active = setActiveWithRetreat([CardType.COLORLESS], []);
    player.bench[0] = TestUtils.pokemonSlot([new Dodrio()]);

    sim.dispatch(new RetreatAction(1, 0));

    expect(prompts.length).toEqual(0);
    expect(player.active.getPokemonCard()).toEqual(jasmine.any(Dodrio));
    expect(player.bench[0].getPokemonCard()).toBe(active);
  });

  it('Should stack with 2 Benched Dodrio', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const active = setActiveWithRetreat([CardType.COLORLESS, CardType.COLORLESS], []);
    player.bench[0] = TestUtils.pokemonSlot([new Dodrio()]);
    player.bench[1] = TestUtils.pokemonSlot([new Dodrio()]);

    sim.dispatch(new RetreatAction(1, 0));

    expect(prompts.length).toEqual(0);
    expect(player.bench[0].getPokemonCard()).toBe(active);
  });

  it('Should not reduce the Retreat Cost of Dodrio itself while it is Active', () => {
    const { player } = TestUtils.getAll(sim);
    const dodrio = player.active.getPokemonCard() as PokemonCard;
    dodrio.retreat = [CardType.COLORLESS];
    TestUtils.setActive(sim, [dodrio]);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    let message = '';
    try {
      sim.dispatch(new RetreatAction(1, 0));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.NOT_ENOUGH_ENERGY);
    expect(TestUtils.getAll(sim).player.active.getPokemonCard()).toBe(dodrio);
  });

  it('Should not reduce the Retreat Cost when Pokémon Powers are blocked', () => {
    const { player } = TestUtils.getAll(sim);
    const active = setActiveWithRetreat([CardType.COLORLESS], []);
    player.bench[0] = TestUtils.pokemonSlot([new Dodrio()]);
    player.bench[1] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    let message = '';
    try {
      sim.dispatch(new RetreatAction(1, 0));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.NOT_ENOUGH_ENERGY);
    expect(TestUtils.getAll(sim).player.active.getPokemonCard()).toBe(active);
  });

  // Rage (10+) - Does 10 damage plus 10 more damage for each damage counter on Dodrio.
  it('Should use Rage without damage counters', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Rage'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should use Rage with 3 damage counters', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.active.damage = 30;

    sim.dispatch(new AttackAction(1, 'Rage'));

    expect(opponent.active.damage).toEqual(40);
  });
});
