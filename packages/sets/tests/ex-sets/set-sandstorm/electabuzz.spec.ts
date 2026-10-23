import {
  AttackAction,
  CardType,
  GameMessage,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { Electabuzz } from '../../../src/ex-sets/set-sandstorm/electabuzz';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Electabuzz SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Electabuzz()],
      [CardType.LIGHTNING, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  // Plasma (10) - Flip a coin. If heads, search your discard pile for a L Energy card and attach it to Electabuzz.
  it('Should use Plasma - heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const [lightning, fire] = TestUtils.makeEnergies([CardType.LIGHTNING, CardType.FIRE]);
    player.discard.cards = [fire, lightning];
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Plasma'));

    const prompt = TestUtils.lastPrompt(sim)!;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Attach energy',
      playerId: player.id,
      cardList: player.discard,
      slots: [SlotType.ACTIVE],
      options: jasmine.objectContaining({ min: 1, max: 1 })
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [{ card: lightning, to: TestUtils.target(sim, player.active) }]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(player.active.energies.cards.length).toEqual(4);
    expect(player.active.energies.cards).toContain(lightning);
    expect(player.discard.cards).toEqual([fire]);
  });

  it('Should use Plasma - tails', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.discard.cards = TestUtils.makeEnergies([CardType.LIGHTNING]);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Plasma'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(player.active.energies.cards.length).toEqual(3);
    expect(player.discard.cards.length).toEqual(1);
  });

  it('Should use Plasma without Lightning Energy in the discard pile', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    player.discard.cards = TestUtils.makeEnergies([CardType.FIRE]);

    sim.dispatch(new AttackAction(1, 'Plasma'));

    expect(prompts.filter(p => p.type === 'Attach energy').length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  // Thunder Spear - Choose 1 of your opponent's Pokémon. This attack does 40 damage to that Pokémon. (Don't apply
  // Weakness and Resistance for Benched Pokémon.)
  it('Should use Thunder Spear on the Defending Pokémon applying Weakness', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const defending = new TestPokemon();
    defending.weakness = [{ type: CardType.LIGHTNING }];
    TestUtils.setDefending(sim, [defending]);

    sim.dispatch(new AttackAction(1, 'Thunder Spear'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.ACTIVE, SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.active]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(80);
  });

  it('Should use Thunder Spear on a Benched Pokémon without Weakness', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    const benched = new TestPokemon();
    benched.weakness = [{ type: CardType.LIGHTNING }];
    opponent.bench[0] = TestUtils.pokemonSlot([benched]);

    sim.dispatch(new AttackAction(1, 'Thunder Spear'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.bench[0].damage).toEqual(40);
  });
});
