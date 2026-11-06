import {
  AttackAction,
  CardType,
  GameMessage,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
  UseAbilityAction,
} from '@ptcg/common';

import { Emboar } from '../../../src/standard/set-black-and-white/emboar';
import { FireEnergy } from '../../../src/base-sets/set-base/fire-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Emboar LTR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Emboar()],
      [CardType.FIRE, CardType.FIRE, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  function useInfernoFandango(): string {
    const { player } = TestUtils.getAll(sim);
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Inferno Fandango', TestUtils.target(sim, player.active)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Inferno Fandango - As often as you like during your turn (before your attack), you may attach a R Energy
  // card from your hand to 1 of your Pokemon.
  it('Should use Inferno Fandango to attach a Fire Energy from hand', () => {
    const { player } = TestUtils.getAll(sim);
    const fire = new FireEnergy();
    player.hand.cards = [fire, ...TestUtils.makeTestCards(2)];
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    expect(useInfernoFandango()).toEqual('');

    const prompt = TestUtils.lastPrompt(sim, player);
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Attach energy',
      playerId: player.id,
      message: GameMessage.ATTACH_ENERGY_CARDS,
      playerType: PlayerType.BOTTOM_PLAYER,
      slots: [SlotType.BENCH, SlotType.ACTIVE],
    }));
    sim.dispatch(new ResolvePromptAction(prompt!.id, [
      { to: TestUtils.target(sim, player.bench[0]), card: fire },
    ]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.bench[0].energies.cards).toEqual([fire]);
    expect(player.hand.cards).not.toContain(fire);
  });

  it('Should not use Inferno Fandango with no Fire Energy in hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = TestUtils.makeTestCards(3);

    expect(useInfernoFandango()).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  it('Should use Inferno Fandango more than once in a turn', () => {
    const { player } = TestUtils.getAll(sim);
    const fire1 = new FireEnergy();
    const fire2 = new FireEnergy();
    player.hand.cards = [fire1, fire2];
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    expect(useInfernoFandango()).toEqual('');
    let prompt = TestUtils.lastPrompt(sim, player);
    sim.dispatch(new ResolvePromptAction(prompt!.id, [
      { to: TestUtils.target(sim, player.bench[0]), card: fire1 },
    ]));

    expect(useInfernoFandango()).toEqual('');
    prompt = TestUtils.lastPrompt(sim, player);
    sim.dispatch(new ResolvePromptAction(prompt!.id, [
      { to: TestUtils.target(sim, player.active), card: fire2 },
    ]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.bench[0].energies.cards).toEqual([fire1]);
    expect(player.active.energies.cards).toContain(fire2);
    expect(player.hand.cards.length).toEqual(0);
  });

  // Heat Crash (80)
  it('Should use Heat Crash for 80 damage', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Heat Crash'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(80);
  });
});
