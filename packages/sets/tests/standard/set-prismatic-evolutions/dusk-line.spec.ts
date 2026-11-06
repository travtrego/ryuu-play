import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  ChoosePokemonPrompt,
  ResolvePromptAction,
  RetreatAction,
  Simulator,
  Stage,
  UseAbilityAction,
} from '@ptcg/common';

import { Dusclops } from '../../../src/standard/set-prismatic-evolutions/dusclops';
import { Dusknoir } from '../../../src/standard/set-prismatic-evolutions/dusknoir';
import { Duskull } from '../../../src/standard/set-prismatic-evolutions/duskull';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Duskull / Dusclops / Dusknoir PRE', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  it('Should have the printed stats', () => {
    const duskull = new Duskull();
    const dusclops = new Dusclops();
    const dusknoir = new Dusknoir();
    expect([duskull.hp, duskull.retreat.length]).toEqual([60, 1]);
    expect([dusclops.hp, dusclops.stage, dusclops.evolvesFrom, dusclops.retreat.length])
      .toEqual([90, Stage.STAGE_1, 'Duskull', 2]);
    expect([dusknoir.hp, dusknoir.stage, dusknoir.evolvesFrom, dusknoir.retreat.length])
      .toEqual([160, Stage.STAGE_2, 'Dusclops', 3]);
    [duskull, dusclops, dusknoir].forEach(c => {
      expect(c.weakness).toEqual([{ type: CardType.DARK }]);
      expect(c.resistance).toEqual([{ type: CardType.FIGHTING, value: -30 }]);
    });
  });

  it('Come and Get You puts up to 3 Duskull from the discard pile onto the Bench', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Duskull()], [CardType.PSYCHIC]);
    const a = new Duskull();
    const b = new Duskull();
    player.discard.cards = [a, b, new TestPokemon()];
    sim.dispatch(new AttackAction(1, 'Come and Get You'));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt.validate([player.discard.cards[2]])).toBeFalse();
    sim.dispatch(new ResolvePromptAction(prompt.id, [a, b]));
    expect(player.bench[0].getPokemonCard()).toBe(a);
    expect(player.bench[1].getPokemonCard()).toBe(b);
  });

  it('Cursed Blast (Dusknoir) puts 13 damage counters on an opponent\'s Pokémon and Knocks itself Out', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0].pokemons.cards = [new Duskull(), new Dusclops(), new Dusknoir()];
    opponent.bench[0].pokemons.cards = [new TestPokemon()];
    sim.dispatch(new UseAbilityAction(1, 'Cursed Blast', TestUtils.target(sim, player.bench[0])));
    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[0]]));
    expect(opponent.bench[0].damage).toEqual(130);
    expect(player.bench[0].pokemons.cards.length).toEqual(0);
    expect(player.discard.cards.length).toEqual(3);
    expect(player.knockedOutTurn).toEqual(sim.store.state.turn);
  });

  it('Cursed Blast (Dusclops) puts 5 damage counters', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0].pokemons.cards = [new Duskull(), new Dusclops()];
    sim.dispatch(new UseAbilityAction(1, 'Cursed Blast', TestUtils.target(sim, player.bench[0])));
    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.active]));
    expect(opponent.active.damage).toEqual(50);
    expect(player.bench[0].pokemons.cards.length).toEqual(0);
  });

  it('Shadow Bind: 150 damage and the Defending Pokémon can\'t retreat next turn', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Duskull(), new Dusclops(), new Dusknoir()],
      [CardType.PSYCHIC, CardType.PSYCHIC, CardType.COLORLESS]);
    opponent.bench[0].pokemons.cards = [new TestPokemon()];
    sim.dispatch(new AttackAction(1, 'Shadow Bind'));
    expect(opponent.active.damage).toEqual(150);
    expect(() => sim.dispatch(new RetreatAction(2, 0))).toThrow();
  });
});
