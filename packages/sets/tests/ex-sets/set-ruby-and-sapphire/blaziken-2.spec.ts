import {
  AttackAction,
  CardType,
  ChooseEnergyPrompt,
  GameMessage,
  PassTurnAction,
  ResolvePromptAction,
  RetreatAction,
  Simulator,
} from '@ptcg/common';

import { Blaziken2 } from '../../../src/ex-sets/set-ruby-and-sapphire/blaziken-2';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Blaziken RS 2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Blaziken2()],
      [CardType.FIRE, CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  // Clutch (20) - The Defending Pokémon can't retreat until the end of your opponent's next turn.
  it('Should use Clutch - blocks retreat', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Clutch'));

    let message = '';
    try {
      sim.dispatch(new RetreatAction(2, 0));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(message).toEqual(GameMessage.BLOCKED_BY_EFFECT);
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Clutch - effect ends after opponent\'s next turn', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    const defending = opponent.active;

    sim.dispatch(new AttackAction(1, 'Clutch'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new RetreatAction(2, 0));

    expect(opponent.bench[0]).toBe(defending);
  });

  // Flamethrower (80) - Discard a R Energy card attached to Blaziken.
  it('Should use Flamethrower', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const fire = player.active.energies.cards[0];

    sim.dispatch(new AttackAction(1, 'Flamethrower'));

    const prompt = TestUtils.lastPrompt(sim) as ChooseEnergyPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose energy',
      playerId: player.id,
      message: GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
      cost: [CardType.FIRE],
      options: jasmine.objectContaining({ allowCancel: false }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, prompt.energy.filter(e => e.card === fire)));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(80);
    expect(player.discard.cards).toEqual([fire]);
    expect(player.active.energies.cards.length).toEqual(3);
  });

});
