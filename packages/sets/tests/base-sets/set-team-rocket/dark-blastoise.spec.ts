import {
  AttackAction,
  CardType,
  PassTurnAction,
  PokemonCard,
  Simulator,
} from '@ptcg/common';

import { DarkBlastoise } from '../../../src/base-sets/set-team-rocket/dark-blastoise';
import { TestUtils } from '../../test-utils';

describe('Dark Blastoise TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    TestUtils.setActive(sim, [new DarkBlastoise()], [CardType.WATER, CardType.WATER]);
  });

  // Hydrocannon (30+) - Does 30 damage plus 20 more damage for each W Energy attached to Dark Blastoise but not
  // used to pay for this attack. You can't add more than 40 damage in this way.
  [
    { energies: [CardType.WATER, CardType.WATER], damage: 30 },
    { energies: [CardType.WATER, CardType.WATER, CardType.WATER], damage: 50 },
    { energies: [CardType.WATER, CardType.WATER, CardType.WATER, CardType.WATER], damage: 70 },
    { energies: [CardType.WATER, CardType.WATER, CardType.WATER, CardType.WATER, CardType.WATER], damage: 70 },
    { energies: [CardType.WATER, CardType.WATER, CardType.FIRE, CardType.COLORLESS], damage: 30 },
  ].forEach(({ energies, damage }) => {
    it(`Should use Hydrocannon with ${energies.map(e => CardType[e]).join(', ')}`, () => {
      const { opponent } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new DarkBlastoise()], energies);

      sim.dispatch(new AttackAction(1, 'Hydrocannon'));

      expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
      expect(opponent.active.damage).toEqual(damage);
    });
  });

  // Rocket Tackle (40) - Dark Blastoise does 10 damage to itself. Flip a coin. If heads, prevent all damage done
  // to Dark Blastoise during your opponent's next turn. (Any other effects of attacks still happen.)
  function rocketTackle(flip: boolean) {
    TestUtils.setActive(sim, [new DarkBlastoise()], [CardType.WATER, CardType.WATER, CardType.WATER]);
    // Flip for Rocket Tackle
    TestUtils.setFlipResults(sim, [flip]);
    sim.dispatch(new AttackAction(1, 'Rocket Tackle'));
  }

  it('Should use Rocket Tackle - 40 damage and 10 to itself', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    rocketTackle(false);

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
    expect(player.active.damage).toEqual(10);
  });

  it('Should use Rocket Tackle - heads prevents damage during the opponent\'s next turn', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as PokemonCard).attacks[0].damage = '50';

    rocketTackle(true);
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
  });

  it('Should use Rocket Tackle - tails does not prevent damage', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as PokemonCard).attacks[0].damage = '50';

    rocketTackle(false);
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(60);
  });

  it('Should stop preventing damage after the opponent\'s next turn', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as PokemonCard).attacks[0].damage = '50';

    rocketTackle(true);
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(60);
  });
});
