import {
  AttackAction,
  CardType,
  PassTurnAction,
  PokemonCard,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { DarkWartortle } from '../../../src/base-sets/set-team-rocket/dark-wartortle';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Dark Wartortle TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new DarkWartortle()], [CardType.WATER, CardType.WATER]);
  });

  // Doubleslap (10×) - Flip 2 coins. This attack does 10 damage times the number of heads.
  [
    { flips: [true, true], damage: 20 },
    { flips: [true, false], damage: 10 },
    { flips: [false, false], damage: 0 },
  ].forEach(({ flips, damage }) => {
    it(`Should use Doubleslap - ${flips.filter(f => f).length} heads`, () => {
      const { opponent, prompts } = TestUtils.getAll(sim);
      TestUtils.setFlipResults(sim, flips);

      sim.dispatch(new AttackAction(1, 'Doubleslap'));

      expect(prompts.filter(p => p.type === 'Coin flip').length).toEqual(2);
      expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
      expect(opponent.active.damage).toEqual(damage);
    });
  });

  // Mirror Shell - If an attack does damage to Dark Wartortle during your opponent's next turn (even if Dark
  // Wartortle is Knocked Out), Dark Wartortle attacks the Defending Pokémon for an equal amount of damage.
  it('Should use Mirror Shell - reflect the damage of the opponent\'s next attack', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as PokemonCard).attacks[0].damage = '30';

    sim.dispatch(new AttackAction(1, 'Mirror Shell'));
    expect(opponent.active.damage).toEqual(0);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(30);
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Mirror Shell - reflect the damage even if Dark Wartortle is Knocked Out', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    (opponent.active.getPokemonCard() as PokemonCard).attacks[0].damage = '70';

    sim.dispatch(new AttackAction(1, 'Mirror Shell'));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    // Resolve the Prize and promotion prompts
    const prize = TestUtils.lastPrompt(sim, opponent);
    if (prize !== undefined && prize.type === 'Choose prize' && prize.result === undefined) {
      sim.dispatch(new ResolvePromptAction(prize.id, opponent.prizes.slice(0, 1)));
    }
    const choose = TestUtils.lastPrompt(sim, player);
    if (choose !== undefined && choose.type === 'Choose pokemon' && choose.result === undefined) {
      sim.dispatch(new ResolvePromptAction(choose.id, [player.bench[0]]));
    }

    expect(player.discard.cards.some(c => c instanceof DarkWartortle)).toBeTrue();
    expect(opponent.active.damage).toEqual(70);
  });

  it('Should not reflect damage after the opponent\'s next turn', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as PokemonCard).attacks[0].damage = '30';

    sim.dispatch(new AttackAction(1, 'Mirror Shell'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(player.active.damage).toEqual(30);
    expect(opponent.active.damage).toEqual(0);
  });
});
