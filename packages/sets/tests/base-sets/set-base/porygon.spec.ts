import {
  AttackAction,
  CardType,
  CheckPokemonStatsEffect,
  GameMessage,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Porygon } from '../../../src/base-sets/set-base/porygon';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class WaterWeakPokemon extends TestPokemon {
  public weakness = [{ type: CardType.WATER }];
}

// Fire attacker used to check that the Defending Pokémon is now weak to Fire.
class FirePokemon extends TestPokemon {
  public cardTypes = [CardType.FIRE];
}

// Option indices in the type selection prompt
const FIRE_OPTION = 1;
const FIGHTING_OPTION = 2;

describe('Porygon BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Porygon()],
      [CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  // Conversion 1 - If the Defending Pokémon has a Weakness, you may change it to a type of your choice other than
  // Colorless.
  it('Should use Conversion 1 and change the Defending Pokémon\'s Weakness', () => {
    const { player, opponent, prompts, state } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new WaterWeakPokemon()]);

    sim.dispatch(new AttackAction(1, 'Conversion 1'));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Select',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TYPE,
      options: jasmine.objectContaining({ allowCancel: true })
    }));
    expect((prompts[0] as any).values[FIRE_OPTION]).toEqual(GameMessage.TYPE_FIRE);

    sim.dispatch(new ResolvePromptAction(prompts[0].id, FIRE_OPTION));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);

    const stats = new CheckPokemonStatsEffect(opponent.active);
    sim.store.reduceEffect(state, stats);
    expect(stats.weakness).toEqual([{ type: CardType.FIRE, value: undefined }]);
  });

  it('Should use Conversion 1 and make the Defending Pokémon take double damage from Fire', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new WaterWeakPokemon()]);
    player.bench[0] = TestUtils.pokemonSlot([new FirePokemon()]);

    sim.dispatch(new AttackAction(1, 'Conversion 1'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, FIRE_OPTION));

    // Swap in the Fire attacker while Porygon stays in play on the Bench
    sim.dispatch(new AttackAction(2, 'Test attack'));
    player.switchPokemon(player.bench[0]);
    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Conversion 1 and keep the Weakness when cancelled', () => {
    const { opponent, prompts, state } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new WaterWeakPokemon()]);

    sim.dispatch(new AttackAction(1, 'Conversion 1'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    const stats = new CheckPokemonStatsEffect(opponent.active);
    sim.store.reduceEffect(state, stats);
    expect(stats.weakness).toEqual([{ type: CardType.WATER }]);
  });

  it('Should use Conversion 1 and do nothing when the Defending Pokémon has no Weakness', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Conversion 1'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  // Conversion 2 - Change Porygon's Resistance to a type of your choice other than Colorless.
  it('Should use Conversion 2 and change Porygon\'s Resistance', () => {
    const { player, opponent, prompts, state } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Conversion 2'));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Select',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TYPE,
    }));
    expect((prompts[0] as any).values[FIGHTING_OPTION]).toEqual(GameMessage.TYPE_FIGHTING);

    sim.dispatch(new ResolvePromptAction(prompts[0].id, FIGHTING_OPTION));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);

    const stats = new CheckPokemonStatsEffect(player.active);
    sim.store.reduceEffect(state, stats);
    expect(stats.resistance).toEqual([{ type: CardType.FIGHTING, value: -30 }]);
  });

  it('Should use Conversion 2 and reduce damage from the chosen type by 30', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const attacker = new FirePokemon();
    attacker.attacks = [{ name: 'Fire attack', cost: [], damage: '40', text: '' }];
    TestUtils.setDefending(sim, [attacker]);

    sim.dispatch(new AttackAction(1, 'Conversion 2'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, FIRE_OPTION));

    sim.dispatch(new AttackAction(2, 'Fire attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
  });
});
