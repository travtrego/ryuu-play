import {
  AttackAction,
  CardTag,
  CardType,
  CheckRetreatCostEffect,
  ChoosePokemonPrompt,
  PlayerType,
  PowerType,
  ResolvePromptAction,
  RetreatAction,
  Simulator,
  Stage,
} from '@ptcg/common';

import { CacneaDLR } from '../../../src/standard/set-delta-reign/cacnea';
import { CacturneDLR } from '../../../src/standard/set-delta-reign/cacturne';
import { MegaGolisopodEx } from '../../../src/standard/set-delta-reign/mega-golisopod-ex';
import { WimpodDLR } from '../../../src/standard/set-delta-reign/wimpod';
import { setDeltaReign } from '../../../src/standard/set-delta-reign';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class BigPokemon extends TestPokemon {
  public hp = 400;
}

class AbilityPokemon extends TestPokemon {
  public hp = 400;
  public powers = [{ name: 'Test Ability', powerType: PowerType.ABILITY, text: '' }];
}

class PokemonEx extends TestPokemon {
  public tags = [CardTag.POKEMON_EX];
}

describe('Mega Golisopod deck cards', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 5;
  });

  it('Should have the printed stats', () => {
    const fire = [{ type: CardType.FIRE }];
    const wimpod = new WimpodDLR();
    expect([wimpod.hp, wimpod.stage, wimpod.cardTypes, wimpod.weakness, wimpod.resistance, wimpod.retreat.length])
      .toEqual([70, Stage.BASIC, [CardType.GRASS], fire, [], 3]);
    expect(wimpod.powers.map(p => [p.name, p.powerType])).toEqual([['Punk Out', PowerType.ABILITY]]);
    expect(wimpod.attacks.map(a => [a.name, a.cost, a.damage])).toEqual([['Ram', [CardType.GRASS], '10']]);

    const golisopod = new MegaGolisopodEx();
    expect([golisopod.hp, golisopod.stage, golisopod.evolvesFrom, golisopod.cardTypes, golisopod.weakness,
      golisopod.resistance, golisopod.retreat.length, golisopod.tags]).toEqual([340, Stage.STAGE_1, 'Wimpod',
      [CardType.GRASS], fire, [], 3, [CardTag.POKEMON_EX, CardTag.MEGA_EVOLUTION_EX]]);
    expect(golisopod.attacks.map(a => [a.name, a.cost.length, a.damage])).toEqual([
      ['Finishing Blow', 1, '60+'], ['Quadruple Hold', 3, '160']]);

    const cacnea = new CacneaDLR();
    expect([cacnea.hp, cacnea.stage, cacnea.cardTypes, cacnea.weakness, cacnea.retreat.length])
      .toEqual([70, Stage.BASIC, [CardType.GRASS], fire, 2]);
    const cacturne = new CacturneDLR();
    expect([cacturne.hp, cacturne.stage, cacturne.evolvesFrom, cacturne.cardTypes, cacturne.weakness,
      cacturne.retreat.length]).toEqual([130, Stage.STAGE_1, 'Cacnea', [CardType.GRASS], fire, 2]);
    expect(cacturne.attacks.map(a => [a.name, a.cost])).toEqual([
      ['Linear Attack', [CardType.COLORLESS]], ['Punishing Needles', [CardType.GRASS]]]);

    expect(setDeltaReign.map(c => c.fullName)).toEqual([
      'Cacnea DLR', 'Cacturne DLR', 'Wimpod DLR', 'Mega Golisopod ex DLR', 'Talonflame ex DLR', 'Zinnia\'s Trust DLR']);
  });

  it('Punk Out: no Retreat Cost only while the opponent has a Pokémon ex in play', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new WimpodDLR()]);
    const without = new CheckRetreatCostEffect(player);
    sim.store.reduceEffect(sim.store.state, without);
    expect(without.cost.length).toEqual(3);

    opponent.bench[0].pokemons.cards = [new PokemonEx()];
    const withEx = new CheckRetreatCostEffect(player);
    sim.store.reduceEffect(sim.store.state, withEx);
    expect(withEx.cost).toEqual([]);
  });

  it('Punk Out does not help a Benched Wimpod\'s Active', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new CacneaDLR()]);
    player.bench[0].pokemons.cards = [new WimpodDLR()];
    opponent.active.pokemons.cards = [new PokemonEx()];
    const effect = new CheckRetreatCostEffect(player);
    sim.store.reduceEffect(sim.store.state, effect);
    expect(effect.cost.length).toEqual(2);
  });

  it('Finishing Blow does 60 to an undamaged Active Pokémon', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new BigPokemon()]);
    TestUtils.setActive(sim, [new WimpodDLR(), new MegaGolisopodEx()], [CardType.GRASS]);
    sim.dispatch(new AttackAction(1, 'Finishing Blow'));
    expect(opponent.active.damage).toEqual(60);
  });

  it('Finishing Blow does 220 when the Active Pokémon already has damage counters', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new BigPokemon()]);
    opponent.active.damage = 20;
    TestUtils.setActive(sim, [new WimpodDLR(), new MegaGolisopodEx()], [CardType.GRASS]);
    sim.dispatch(new AttackAction(1, 'Finishing Blow'));
    expect(opponent.active.damage).toEqual(20 + 220);
  });

  it('Quadruple Hold does 160 and the Defending Pokémon can\'t retreat next turn', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new BigPokemon()]);
    opponent.bench[0].pokemons.cards = [new TestPokemon()];
    TestUtils.setActive(sim, [new WimpodDLR(), new MegaGolisopodEx()],
      [CardType.GRASS, CardType.GRASS, CardType.GRASS]);
    sim.dispatch(new AttackAction(1, 'Quadruple Hold'));
    expect(opponent.active.damage).toEqual(160);
    expect(() => sim.dispatch(new RetreatAction(2, 0))).toThrow();
  });

  it('Knock Away does 10, or 20 on heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new BigPokemon()]);
    TestUtils.setActive(sim, [new CacneaDLR()], [CardType.GRASS]);
    TestUtils.setFlipResults(sim, [true]);
    sim.dispatch(new AttackAction(1, 'Knock Away'));
    expect(opponent.active.damage).toEqual(20);
  });

  it('Linear Attack does 30 to a chosen Benched Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.bench[1].pokemons.cards = [new TestPokemon()];
    TestUtils.setActive(sim, [new CacneaDLR(), new CacturneDLR()], [CardType.GRASS]);
    sim.dispatch(new AttackAction(1, 'Linear Attack'));
    const choose = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    expect(choose instanceof ChoosePokemonPrompt).toBeTrue();
    expect(choose.playerType).toEqual(PlayerType.TOP_PLAYER);
    sim.dispatch(new ResolvePromptAction(choose.id, [opponent.bench[1]]));
    expect(opponent.bench[1].damage).toEqual(30);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Punishing Needles does 50 more for each opposing Pokémon in play with an Ability', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new AbilityPokemon()]);
    opponent.bench[0].pokemons.cards = [new AbilityPokemon()];
    opponent.bench[1].pokemons.cards = [new TestPokemon()];
    TestUtils.setActive(sim, [new CacneaDLR(), new CacturneDLR()], [CardType.GRASS]);
    sim.dispatch(new AttackAction(1, 'Punishing Needles'));
    expect(opponent.active.damage).toEqual(10 + 50 * 2);
  });
});
