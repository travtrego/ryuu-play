import {
  AddSpecialConditionsEffect,
  AttackAction,
  AttackEffect,
  CardType,
  Effect,
  GameMessage,
  PassTurnAction,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
  State,
  StoreLike,
} from '@ptcg/common';

import { Mewtwo } from '../../../src/base-sets/set-base/mewtwo';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

// Opponent Pokémon whose attack also has an effect (Paralysis).
class ParalyzingPokemon extends TestPokemon {
  public attacks = [
    { name: 'Paralyzing attack', cost: [], damage: '10', text: 'The Defending Pokémon is now Paralyzed.' },
  ];

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      store.reduceEffect(state, new AddSpecialConditionsEffect(effect, [SpecialCondition.PARALYZED]));
    }
    return state;
  }
}

describe('Mewtwo BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Mewtwo()],
      [CardType.PSYCHIC, CardType.PSYCHIC],
    );
  });

  // Psychic (10+) - Does 10 damage plus 10 more damage for each Energy card attached to the Defending Pokémon.
  it('Should use Psychic for 10 damage when the Defending Pokémon has no Energy', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Psychic'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should use Psychic for 40 damage when the Defending Pokémon has 3 Energy cards', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestPokemon()], [CardType.FIRE, CardType.WATER, CardType.COLORLESS]);

    sim.dispatch(new AttackAction(1, 'Psychic'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });

  // Barrier - Discard 1 P Energy card attached to Mewtwo in order to prevent all effects of attacks, including
  // damage, done to Mewtwo during your opponent's next turn.
  it('Should use Barrier, discard 1 Psychic Energy and prevent damage during the opponent\'s next turn', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const energy = player.active.energies.cards[0];

    sim.dispatch(new AttackAction(1, 'Barrier'));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose energy',
      playerId: player.id,
      message: GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
      cost: [CardType.PSYCHIC],
      options: jasmine.objectContaining({ allowCancel: false })
    }));

    sim.dispatch(new ResolvePromptAction(prompts[0].id, [{ card: energy, provides: [CardType.PSYCHIC] }]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(player.discard.cards).toEqual([energy]);
    expect(player.active.energies.cards).toEqual(TestUtils.makeEnergies([CardType.PSYCHIC]));

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Barrier and prevent other effects of attacks', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new ParalyzingPokemon()]);

    sim.dispatch(new AttackAction(1, 'Barrier'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [
      { card: player.active.energies.cards[0], provides: [CardType.PSYCHIC] }
    ]));

    sim.dispatch(new AttackAction(2, 'Paralyzing attack'));

    expect(player.active.damage).toEqual(0);
    expect(player.active.specialConditions).toEqual([]);
  });

  it('Should be damaged and paralyzed by the opponent\'s attack without Barrier', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new ParalyzingPokemon()]);

    sim.dispatch(new AttackAction(1, 'Psychic'));
    sim.dispatch(new AttackAction(2, 'Paralyzing attack'));

    expect(player.active.damage).toEqual(10);
    expect(player.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should stop Barrier after the opponent\'s next turn', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Barrier'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [
      { card: player.active.energies.cards[0], provides: [CardType.PSYCHIC] }
    ]));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(player.active.damage).toEqual(10);
  });
});
