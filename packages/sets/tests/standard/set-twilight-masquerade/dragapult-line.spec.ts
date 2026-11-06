import {
  AttackAction,
  AttackEffect,
  CardTag,
  CardType,
  ChooseCardsPrompt,
  PlayerType,
  PutDamageEffect,
  PutDamagePrompt,
  ResolvePromptAction,
  Simulator,
  SlotType,
  Stage,
  UseAbilityAction,
} from '@ptcg/common';

import { DragapultEx } from '../../../src/standard/set-twilight-masquerade/dragapult-ex';
import { Drakloak } from '../../../src/standard/set-twilight-masquerade/drakloak';
import { Dreepy } from '../../../src/standard/set-twilight-masquerade/dreepy';
import { TestCard } from '../../test-cards/test-card';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class TeraBench extends TestPokemon {
  public tags = [CardTag.TERA];
}

describe('Dreepy / Drakloak / Dragapult ex TWM', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  it('Should have the printed stats', () => {
    const dreepy = new Dreepy();
    expect([dreepy.hp, dreepy.cardTypes[0], dreepy.retreat.length, dreepy.weakness.length])
      .toEqual([70, CardType.DRAGON, 1, 0]);
    expect(dreepy.attacks.map(a => [a.name, a.damage])).toEqual([['Petty Grudge', '10'], ['Bite', '40']]);

    const drakloak = new Drakloak();
    expect([drakloak.hp, drakloak.stage, drakloak.evolvesFrom]).toEqual([90, Stage.STAGE_1, 'Dreepy']);

    const dragapult = new DragapultEx();
    expect([dragapult.hp, dragapult.stage, dragapult.evolvesFrom, dragapult.retreat.length])
      .toEqual([320, Stage.STAGE_2, 'Drakloak', 1]);
    expect(dragapult.tags).toEqual(jasmine.arrayContaining([CardTag.POKEMON_EX, CardTag.TERA]));
    expect(dragapult.attacks[1].cost).toEqual([CardType.FIRE, CardType.PSYCHIC]);
  });

  it('Recon Directive: 1 of the top 2 cards to the hand, the other to the bottom, once per turn', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0].pokemons.cards = [new Dreepy(), new Drakloak()];
    const top1 = new TestCard();
    const top2 = new TestCard();
    player.deck.cards = [top1, top2, ...TestUtils.makeTestCards(5)];

    sim.dispatch(new UseAbilityAction(1, 'Recon Directive', TestUtils.target(sim, player.bench[0])));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt instanceof ChooseCardsPrompt).toBeTrue();
    expect(prompt.cards.cards).toEqual([top1, top2]);
    sim.dispatch(new ResolvePromptAction(prompt.id, [top2]));

    expect(player.hand.cards).toEqual([top2]);
    expect(player.deck.cards[player.deck.cards.length - 1]).toBe(top1);
    expect(player.deck.cards.length).toEqual(6);
    expect(() => sim.dispatch(
      new UseAbilityAction(1, 'Recon Directive', TestUtils.target(sim, player.bench[0])))).toThrow();
  });

  it('Phantom Dive: 200 to the Active and 6 damage counters on the Bench, even on a Tera Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Dreepy(), new Drakloak(), new DragapultEx()], [CardType.FIRE, CardType.PSYCHIC]);
    opponent.bench[0].pokemons.cards = [new TestPokemon()];
    opponent.bench[1].pokemons.cards = [new TeraBench()];

    sim.dispatch(new AttackAction(1, 'Phantom Dive'));
    const prompt = TestUtils.lastPrompt(sim, player) as PutDamagePrompt;
    expect(prompt instanceof PutDamagePrompt).toBeTrue();
    expect(prompt.damage).toEqual(60);
    sim.dispatch(new ResolvePromptAction(prompt.id, [
      { target: { player: PlayerType.TOP_PLAYER, slot: SlotType.BENCH, index: 0 }, damage: 40 },
      { target: { player: PlayerType.TOP_PLAYER, slot: SlotType.BENCH, index: 1 }, damage: 20 },
    ]));

    expect(opponent.active.damage).toEqual(200);
    expect(opponent.bench[0].damage).toEqual(40);
    expect(opponent.bench[1].damage).toEqual(20);
  });

  it('Phantom Dive with an empty opponent Bench just does 200', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new DragapultEx()], [CardType.FIRE, CardType.PSYCHIC]);
    sim.dispatch(new AttackAction(1, 'Phantom Dive'));
    expect(TestUtils.lastPrompt(sim, player) instanceof PutDamagePrompt).toBeFalse();
    expect(opponent.active.damage).toEqual(200);
  });

  it('A Benched Dragapult ex takes no damage from attacks (Tera), but does in the Active Spot', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.bench[0].pokemons.cards = [new DragapultEx()];
    const attack = new AttackEffect(player, opponent, player.active.getPokemonCard()!.attacks[0]);
    const benchHit = new PutDamageEffect(attack, 100);
    benchHit.target = opponent.bench[0];
    sim.store.reduceEffect(sim.store.state, benchHit);
    expect(opponent.bench[0].damage).toEqual(0);

    opponent.active.pokemons.cards = [new DragapultEx()];
    const activeHit = new PutDamageEffect(attack, 100);
    activeHit.target = opponent.active;
    sim.store.reduceEffect(sim.store.state, activeHit);
    expect(opponent.active.damage).toEqual(100);
  });
});
