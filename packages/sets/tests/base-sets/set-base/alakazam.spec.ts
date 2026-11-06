import {
  AttackAction,
  CardType,
  DamageTransfer,
  GameMessage,
  MoveDamagePrompt,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
  SpecialCondition,
  UseAbilityAction,
} from '@ptcg/common';

import { Abra } from '../../../src/base-sets/set-base/abra';
import { Alakazam } from '../../../src/base-sets/set-base/alakazam';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Alakazam BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Alakazam()],
      [CardType.PSYCHIC, CardType.PSYCHIC, CardType.PSYCHIC],
    );
  });

  // Damage Swap - As often as you like during your turn (before your attack), you may move 1 damage counter from
  // 1 of your Pokémon to another as long as you don't Knock Out that Pokémon. This power can't be used if
  // Alakazam is Asleep, Confused, or Paralyzed.
  it('Should use Damage Swap - move damage counters between own Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.damage = 30;
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new UseAbilityAction(1, 'Damage Swap', TestUtils.target(sim, player.active)));

    const prompt = TestUtils.lastPrompt(sim) as MoveDamagePrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Move damage',
      playerId: player.id,
      message: GameMessage.MOVE_DAMAGE,
      playerType: PlayerType.BOTTOM_PLAYER,
      slots: [SlotType.ACTIVE, SlotType.BENCH],
    }));

    const transfer: DamageTransfer = {
      from: TestUtils.target(sim, player.active),
      to: TestUtils.target(sim, player.bench[0])
    };
    sim.dispatch(new ResolvePromptAction(prompt.id, [transfer, transfer]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
    expect(player.bench[0].damage).toEqual(20);
  });

  it('Should use Damage Swap - as often as you like', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [], [], 30);
    const target = TestUtils.target(sim, player.active);
    const transfer: DamageTransfer = {
      from: TestUtils.target(sim, player.bench[0]),
      to: TestUtils.target(sim, player.active)
    };

    sim.dispatch(new UseAbilityAction(1, 'Damage Swap', target));
    sim.dispatch(new ResolvePromptAction(TestUtils.lastPrompt(sim)!.id, [transfer]));

    sim.dispatch(new UseAbilityAction(1, 'Damage Swap', target));
    sim.dispatch(new ResolvePromptAction(TestUtils.lastPrompt(sim)!.id, [transfer]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.bench[0].damage).toEqual(10);
    expect(player.active.damage).toEqual(20);
  });

  it('Should use Damage Swap - canceled', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.damage = 30;
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new UseAbilityAction(1, 'Damage Swap', TestUtils.target(sim, player.active)));
    sim.dispatch(new ResolvePromptAction(TestUtils.lastPrompt(sim)!.id, null));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(30);
    expect(player.bench[0].damage).toEqual(0);
  });

  it('Should use Damage Swap - limits damage on each Pokémon to below its HP', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new Abra()]);

    sim.dispatch(new UseAbilityAction(1, 'Damage Swap', TestUtils.target(sim, player.active)));

    const prompt = TestUtils.lastPrompt(sim) as MoveDamagePrompt;
    expect(prompt.maxAllowedDamage).toEqual([
      { target: TestUtils.target(sim, player.active), damage: 70 },
      { target: TestUtils.target(sim, player.bench[0]), damage: 20 },
    ]);
  });

  // BUG: Damage Swap applies any transfer it receives; moving a counter that Knocks Out the target is not rejected
  it('Should not use Damage Swap to Knock Out a Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.damage = 30;
    // Abra has 30 HP, 2 damage counters
    player.bench[0] = TestUtils.pokemonSlot([new Abra()], [], [], 20);

    sim.dispatch(new UseAbilityAction(1, 'Damage Swap', TestUtils.target(sim, player.active)));

    const prompt = TestUtils.lastPrompt(sim) as MoveDamagePrompt;
    const transfer: DamageTransfer = {
      from: TestUtils.target(sim, player.active),
      to: TestUtils.target(sim, player.bench[0])
    };

    // Either the result is rejected or the transfer is not applied
    let rejected = false;
    try {
      sim.dispatch(new ResolvePromptAction(prompt.id, [transfer]));
    } catch (error) {
      rejected = true;
    }

    expect(rejected || player.bench[0].damage < 30).toBeTrue();
    expect(player.bench[0].pokemons.cards.length).toEqual(1);
  });

  [
    { name: 'Asleep', condition: SpecialCondition.ASLEEP },
    { name: 'Confused', condition: SpecialCondition.CONFUSED },
    { name: 'Paralyzed', condition: SpecialCondition.PARALYZED },
  ].forEach(({ name, condition }) => {
    it(`Should not use Damage Swap when Alakazam is ${name}`, () => {
      const { player } = TestUtils.getAll(sim);
      player.active.damage = 30;
      player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
      player.active.addSpecialCondition(condition);

      let message = '';
      try {
        sim.dispatch(new UseAbilityAction(1, 'Damage Swap', TestUtils.target(sim, player.active)));
      } catch (error) {
        message = TestUtils.getErrorMessage(error);
      }

      expect(message).toEqual(GameMessage.CANNOT_USE_POWER);
      expect(player.active.damage).toEqual(30);
    });
  });

  it('Should use Damage Swap while Alakazam is on the Bench', () => {
    const { player } = TestUtils.getAll(sim);
    const alakazam = player.active.getPokemonCard() as Alakazam;
    TestUtils.setActive(sim, [new TestPokemon()]);
    player.active.damage = 20;
    player.bench[0] = TestUtils.pokemonSlot([alakazam]);

    sim.dispatch(new UseAbilityAction(1, 'Damage Swap', TestUtils.target(sim, player.bench[0])));
    const transfer: DamageTransfer = {
      from: TestUtils.target(sim, player.active),
      to: TestUtils.target(sim, player.bench[0])
    };
    sim.dispatch(new ResolvePromptAction(TestUtils.lastPrompt(sim)!.id, [transfer]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
    expect(player.bench[0].damage).toEqual(10);
  });

  // Confuse Ray (30) - Flip a coin. If heads, the Defending Pokémon is now Confused.
  it('Should use Confuse Ray - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Confuse Ray'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
  });

  it('Should use Confuse Ray - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Confuse Ray'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.active.specialConditions).toEqual([]);
  });

});
