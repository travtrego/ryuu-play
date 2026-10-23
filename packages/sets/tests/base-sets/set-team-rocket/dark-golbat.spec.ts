import {
  AttackAction,
  CardType,
  PlayCardAction,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { DarkGolbat } from '../../../src/base-sets/set-team-rocket/dark-golbat';
import { Zubat } from '../../../src/base-sets/set-team-rocket/zubat';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Dark Golbat TR', () => {
  let sim: Simulator;
  let golbat: DarkGolbat;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 3;
    golbat = new DarkGolbat();

    TestUtils.setActive(sim, [new Zubat()], [CardType.GRASS, CardType.GRASS]);
    sim.store.state.players[0].hand.cards = [golbat];
  });

  // Sneak Attack - When you play Dark Golbat from your hand, you may choose 1 of your opponent's Pokémon. If you
  // do, Dark Golbat does 10 damage to that Pokémon. Apply Weakness and Resistance.
  it('Should use Sneak Attack on a Benched Pokémon when evolving', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.ACTIVE, SlotType.BENCH],
      options: jasmine.objectContaining({ allowCancel: true }),
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.getPokemonCard()).toBe(golbat);
    expect(opponent.bench[0].damage).toEqual(10);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Sneak Attack and apply Weakness', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as TestPokemon).weakness = [{ type: CardType.GRASS }];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.active]));

    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Sneak Attack and apply Resistance', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as TestPokemon).resistance = [{ type: CardType.GRASS, value: -30 }];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.active]));

    expect(opponent.active.damage).toEqual(0);
  });

  it('Should apply Weakness to Dark Golbat\'s type when it evolves on the Bench', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const waterActive = new TestPokemon();
    waterActive.cardTypes = [CardType.WATER];
    TestUtils.setActive(sim, [waterActive]);
    player.bench[0] = TestUtils.pokemonSlot([new Zubat()]);
    (opponent.active.getPokemonCard() as TestPokemon).weakness = [{ type: CardType.GRASS }];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.bench[0])));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.active]));

    expect(player.bench[0].getPokemonCard()).toBe(golbat);
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should allow not using Sneak Attack', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.getPokemonCard()).toBe(golbat);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should not use Sneak Attack when Pokémon Powers are blocked', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect(prompts.length).toEqual(0);
    expect(player.active.getPokemonCard()).toBe(golbat);
  });

  // Flitter - Choose 1 of your opponent's Pokémon. This attack does 20 damage to that Pokémon. Don't apply Weakness
  // and Resistance for this attack.
  it('Should use Flitter on the Defending Pokémon without Weakness', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Zubat(), golbat], [CardType.GRASS, CardType.GRASS]);
    player.hand.cards = [];
    (opponent.active.getPokemonCard() as TestPokemon).weakness = [{ type: CardType.GRASS }];

    sim.dispatch(new AttackAction(1, 'Flitter'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.active]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Flitter on a Benched Pokémon without Resistance', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Zubat(), golbat], [CardType.GRASS, CardType.GRASS]);
    player.hand.cards = [];
    const benched = new TestPokemon();
    benched.resistance = [{ type: CardType.GRASS, value: -30 }];
    opponent.bench[0] = TestUtils.pokemonSlot([benched]);

    sim.dispatch(new AttackAction(1, 'Flitter'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.bench[0].damage).toEqual(20);
    expect(opponent.active.damage).toEqual(0);
  });
});
