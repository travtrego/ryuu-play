import {
  AttackAction,
  CardType,
  ChooseEnergyPrompt,
  GameMessage,
  PassTurnAction,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Sharpedo } from '../../../src/ex-sets/set-ruby-and-sapphire/sharpedo';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Sharpedo RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Sharpedo()], [CardType.WATER, CardType.COLORLESS, CardType.DARK]);
  });

  // Rough Skin - If Sharpedo is your Active Pokémon and is damaged by an opponent's attack (even if Sharpedo is
  // Knocked Out), put 2 damage counters on the Attacking Pokémon.
  it('Should use Rough Skin', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Rough Skin - not when Sharpedo is on the Bench', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = player.active;
    player.active = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Rough Skin - power blocked', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(opponent.active.damage).toEqual(0);
  });

  // Dark Slash (40+) - You may discard a D Energy card attached to Sharpedo. If you do, this attack does 40 damage
  // plus 30 more damage.
  it('Should use Dark Slash - discard Darkness Energy', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const dark = player.active.energies.cards[2];

    sim.dispatch(new AttackAction(1, 'Dark Slash'));

    const prompt = TestUtils.lastPrompt(sim) as ChooseEnergyPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose energy',
      playerId: player.id,
      message: GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
      cost: [CardType.DARK],
      options: jasmine.objectContaining({ allowCancel: true }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, prompt.energy.filter(e => e.card === dark)));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(70);
    expect(player.discard.cards).toEqual([dark]);
  });

  it('Should use Dark Slash - do not discard', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Dark Slash'));

    const prompt = TestUtils.lastPrompt(sim) as ChooseEnergyPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, null));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
    expect(player.active.energies.cards.length).toEqual(3);
  });

});
