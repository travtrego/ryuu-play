import {
  AttackAction,
  CardType,
  GameMessage,
  PassTurnAction,
  PokemonCard,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Clefable } from '../../../src/base-sets/set-jungle/clefable';
import { Jigglypuff } from '../../../src/base-sets/set-jungle/jigglypuff';
import { TestUtils } from '../../test-utils';

describe('Clefable JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Clefable()],
      [CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  function setDefendingAttack(damage: number, cardTypes: CardType[] = []): PokemonCard {
    const { opponent } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard() as PokemonCard;
    defending.attacks[0].damage = String(damage);
    defending.cardTypes = cardTypes;
    return defending;
  }

  // Metronome - Choose 1 of the Defending Pokémon's attacks. Metronome copies that attack except for its Energy
  // costs and anything else required in order to use that attack, such as discarding Energy cards. (No matter what
  // type the Defending Pokémon is, Clefable's type is still Colorless.)
  it('Should use Metronome - copies the Defending Pokémon\'s attack ignoring its Energy cost', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    const defending = setDefendingAttack(40);
    defending.attacks[0].cost = [CardType.FIRE, CardType.FIRE, CardType.FIRE];

    sim.dispatch(new AttackAction(1, 'Metronome'));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose attack',
      playerId: player.id,
      message: GameMessage.CHOOSE_ATTACK_TO_COPY,
      cards: [defending],
    }));

    sim.dispatch(new ResolvePromptAction(prompts[0].id, defending.attacks[0]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Metronome - copies the effects of the attack', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    const jigglypuff = new Jigglypuff();
    TestUtils.setDefending(sim, [jigglypuff]);
    // tails for the between-turns sleep check
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Metronome'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, jigglypuff.attacks[0]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
  });

  it('Should use Metronome - Clefable is still Colorless', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    const defending = setDefendingAttack(20, [CardType.FIRE]);
    defending.weakness = [{ type: CardType.FIRE }];

    sim.dispatch(new AttackAction(1, 'Metronome'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, defending.attacks[0]));

    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Metronome - Defending Pokémon without attacks', () => {
    const { opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as PokemonCard).attacks = [];

    sim.dispatch(new AttackAction(1, 'Metronome'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  // Minimize - All damage done by attacks to Clefable during your opponent's next turn is reduced by 20 (after
  // applying Weakness and Resistance).
  it('Should use Minimize - reduces damage during the opponent\'s next turn by 20', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    setDefendingAttack(50);

    sim.dispatch(new AttackAction(1, 'Minimize'));
    expect(opponent.active.damage).toEqual(0);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(30);
  });

  it('Should use Minimize - reduces damage after applying Weakness', () => {
    const { player } = TestUtils.getAll(sim);
    setDefendingAttack(30, [CardType.FIGHTING]);

    sim.dispatch(new AttackAction(1, 'Minimize'));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    // 30 x2 = 60, -20 = 40
    expect(player.active.damage).toEqual(40);
  });

  it('Should use Minimize - damage can\'t be reduced below 0', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.damage = 30;
    setDefendingAttack(10);

    sim.dispatch(new AttackAction(1, 'Minimize'));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(player.active.damage).toEqual(30);
  });

  it('Should use Minimize - the effect ends after the opponent\'s next turn', () => {
    const { player } = TestUtils.getAll(sim);
    setDefendingAttack(50);

    sim.dispatch(new AttackAction(1, 'Minimize'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(player.active.damage).toEqual(50);
  });
});
