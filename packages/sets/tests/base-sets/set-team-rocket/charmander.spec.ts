import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
  UseAbilityAction,
} from '@ptcg/common';

import { Charmander } from '../../../src/base-sets/set-team-rocket/charmander';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Charmander TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Charmander()], [CardType.FIRE]);
  });

  function useGatherFire(): string {
    const { player } = TestUtils.getAll(sim);
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Gather Fire', TestUtils.target(sim, player.active)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Gather Fire - Once during your turn (before your attack), you may take 1 R Energy card attached to 1 of your
  // other Pokémon and attach it to Charmander. This power can't be used if Charmander is Asleep, Confused, or
  // Paralyzed.
  it('Should use Gather Fire to move a R Energy from another Pokémon to Charmander', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [CardType.WATER, CardType.FIRE]);
    const fire = player.bench[0].energies.cards[1];

    expect(useGatherFire()).toEqual('');
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Move energy',
      playerId: player.id,
      options: jasmine.objectContaining({
        min: 1,
        max: 1,
        blockedFrom: [TestUtils.target(sim, player.active)],
        blockedTo: [TestUtils.target(sim, player.bench[0])],
        blockedMap: [{ source: TestUtils.target(sim, player.bench[0]), blocked: [0] }],
      }),
    }));

    sim.dispatch(new ResolvePromptAction(prompts[0].id, [{
      from: TestUtils.target(sim, player.bench[0]),
      to: TestUtils.target(sim, player.active),
      card: fire,
    }]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.energies.cards.length).toEqual(2);
    expect(player.active.energies.cards[1]).toBe(fire);
    expect(player.bench[0].energies.cards.length).toEqual(1);
  });

  it('Should use Gather Fire only once per turn', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [CardType.FIRE, CardType.FIRE]);

    useGatherFire();
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [{
      from: TestUtils.target(sim, player.bench[0]),
      to: TestUtils.target(sim, player.active),
      card: player.bench[0].energies.cards[0],
    }]));

    expect(useGatherFire()).toEqual(GameMessage.POWER_ALREADY_USED);
  });

  it('Should not use Gather Fire without R Energy on other Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [CardType.WATER]);

    expect(useGatherFire()).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  [SpecialCondition.ASLEEP, SpecialCondition.CONFUSED, SpecialCondition.PARALYZED].forEach(condition => {
    it(`Should not use Gather Fire when Charmander is ${SpecialCondition[condition]}`, () => {
      const { player, prompts } = TestUtils.getAll(sim);
      player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [CardType.FIRE]);
      player.active.addSpecialCondition(condition);

      expect(useGatherFire()).toEqual(GameMessage.CANNOT_USE_POWER);
      expect(prompts.length).toEqual(0);
    });
  });

  // Fire Tail (20)
  it('Should use Fire Tail', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Fire Tail'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });
});
