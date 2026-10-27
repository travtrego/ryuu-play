import {
  AttackAction,
  GameMessage,
  PassTurnAction,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { ExpShare } from '../../../src/standard/set-black-and-white/exp-share';
import { FireEnergy } from '../../../src/base-sets/set-base/fire-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class Hitter extends TestPokemon {
  public attacks = [
    { name: 'Big hit', cost: [], damage: '200', text: '' },
  ];
}

describe('Exp Share SUM', () => {
  let sim: Simulator;
  let trainerCard: ExpShare;
  let fire: FireEnergy;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 3;
    trainerCard = new ExpShare();
    fire = new FireEnergy();

    const active = new TestPokemon();
    active.hp = 60;
    TestUtils.setActive(sim, [active]);
    sim.store.state.players[0].active.energies.cards = [fire];
    TestUtils.setDefending(sim, [new Hitter()]);
  });

  // Resolves the prompts that follow a Knock Out.
  function resolveKnockOutPrompts() {
    const { player, opponent } = TestUtils.getAll(sim);
    const promote = TestUtils.lastPrompt(sim, player);
    if (promote !== undefined && promote.type === 'Choose pokemon' && promote.result === undefined) {
      sim.dispatch(new ResolvePromptAction(promote.id, [player.bench[0]]));
    }
    const prize = TestUtils.lastPrompt(sim, opponent);
    if (prize !== undefined && prize.type === 'Choose prize' && prize.result === undefined) {
      sim.dispatch(new ResolvePromptAction(prize.id, opponent.prizes.slice(0, 1)));
    }
  }

  // When your Active Pokemon is Knocked Out by damage from an opponent's attack, you may move 1 basic Energy
  // card that was attached to that Pokemon to the Pokemon this card is attached to.
  it('Should move a basic Energy to the Pokemon holding Exp Share', () => {
    const { player } = TestUtils.getAll(sim);
    // Keep the slot: promoting it swaps the bench and active slot objects
    const expShareSlot = TestUtils.pokemonSlot([new TestPokemon()], [], [trainerCard]);
    player.bench[0] = expShareSlot;

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Big hit'));

    const prompt = TestUtils.lastPrompt(sim, player);
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Attach energy',
      playerId: player.id,
      message: GameMessage.ATTACH_ENERGY_TO_BENCH,
      playerType: PlayerType.BOTTOM_PLAYER,
      slots: [SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(prompt!.id, [
      { to: TestUtils.target(sim, player.bench[0]), card: fire },
    ]));
    resolveKnockOutPrompts();

    expect(expShareSlot.energies.cards).toContain(fire);
    expect(player.discard.cards).not.toContain(fire);
  });

  it('Should leave the Energy in the discard pile when the prompt is canceled', () => {
    const { player } = TestUtils.getAll(sim);
    const expShareSlot = TestUtils.pokemonSlot([new TestPokemon()], [], [trainerCard]);
    player.bench[0] = expShareSlot;

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Big hit'));

    const prompt = TestUtils.lastPrompt(sim, player);
    sim.dispatch(new ResolvePromptAction(prompt!.id, null));
    resolveKnockOutPrompts();

    expect(expShareSlot.energies.cards.length).toEqual(0);
    expect(player.discard.cards).toContain(fire);
  });

  it('Should not prompt when no Benched Pokemon holds Exp Share', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Big hit'));

    const prompt = TestUtils.lastPrompt(sim, player);
    expect(prompt === undefined || prompt.type !== 'Attach energy').toBeTrue();
    resolveKnockOutPrompts();

    expect(player.discard.cards).toContain(fire);
  });
});
