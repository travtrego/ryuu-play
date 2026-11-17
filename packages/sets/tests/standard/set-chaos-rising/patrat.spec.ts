import { AttackAction, CardType, Simulator, Stage, UseAbilityAction } from '@ptcg/common';

import { Patrat } from '../../../src/standard/set-chaos-rising/patrat';
import { Munkidori } from '../../../src/standard/set-twilight-masquerade/munkidori';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Patrat CRI', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  it('has the printed stats', () => {
    const patrat = new Patrat();
    expect([patrat.stage, patrat.hp, patrat.cardTypes]).toEqual([Stage.BASIC, 70, [CardType.COLORLESS]]);
    expect(patrat.weakness).toEqual([{ type: CardType.FIGHTING }]);
    expect(patrat.resistance).toEqual([]);
    expect(patrat.retreat).toEqual([CardType.COLORLESS]);
    expect(patrat.powers.map(p => p.name)).toEqual(['Watchful Eye']);
  });

  it('Bite does 10', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Patrat()], [CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Bite'));
    expect(opponent.active.damage).toEqual(10);
  });

  it('Watchful Eye (either player\'s Patrat) stops Munkidori\'s Adrena-Brain from moving damage counters', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Munkidori()], [CardType.DARK]);
    player.active.damage = 30;
    opponent.bench[0].pokemons.cards = [new Patrat()];
    expect(Patrat.blocksMovingDamage(sim.store, sim.store.state)).toBeTrue();
    expect(() => sim.dispatch(new UseAbilityAction(1, 'Adrena-Brain', TestUtils.target(sim, player.active))))
      .toThrow();

    // A refused action restores a copy of the state; look the players up again.
    const after = TestUtils.getAll(sim);
    after.opponent.bench[0].pokemons.cards = [];
    expect(Patrat.blocksMovingDamage(sim.store, sim.store.state)).toBeFalse();
    after.player.bench[1].pokemons.cards = [new Patrat()];
    expect(Patrat.blocksMovingDamage(sim.store, sim.store.state)).toBeTrue();
  });

  it('a Patrat in the hand or discard pile does nothing; an Ability lock turns Watchful Eye off', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.hand.cards = [new Patrat()];
    player.discard.cards = [new Patrat()];
    expect(Patrat.blocksMovingDamage(sim.store, sim.store.state)).toBeFalse();
    opponent.bench[0].pokemons.cards = [new Patrat()];
    opponent.active.pokemons.cards = [new TestPokemonBlockPowers()];
    expect(Patrat.blocksMovingDamage(sim.store, sim.store.state)).toBeFalse();
  });
});
