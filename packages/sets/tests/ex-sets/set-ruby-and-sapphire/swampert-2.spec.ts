import {
  AttackAction,
  CardType,
  ChoosePokemonPrompt,
  GameMessage,
  PlayCardAction,
  PlayerType,
  PokemonCard,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { FireEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/fire-energy';
import { Swampert2 } from '../../../src/ex-sets/set-ruby-and-sapphire/swampert-2';
import { WaterEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/water-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Swampert RS 2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Swampert2()], [CardType.WATER, CardType.COLORLESS, CardType.COLORLESS]);
    sim.store.state.turn = 3;
  });

  // Natural Remedy - Once during your turn (before your attack), when you attach a W Energy card from your hand to
  // Swampert, remove 1 damage counter from Swampert.
  it('Should use Natural Remedy - attach Water Energy', () => {
    const { player } = TestUtils.getAll(sim);
    const water = new WaterEnergy();
    player.hand.cards = [water];
    player.active.damage = 30;

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.energies.cards).toContain(water);
    expect(player.active.damage).toEqual(20);
  });

  it('Should use Natural Remedy - other Energy does not heal', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [new FireEnergy()];
    player.active.damage = 30;

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect(player.active.damage).toEqual(30);
  });

  it('Should use Natural Remedy - power blocked', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [new WaterEnergy()];
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);
    player.active.damage = 30;

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect(player.active.damage).toEqual(30);
  });

  // Water Arrow - Choose 1 of your opponent's Pokémon. This attack does 20 damage to that Pokémon. (Don't apply
  // Weakness and Resistance for Benched Pokémon.)
  it('Should use Water Arrow - Benched Pokemon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const benched = new TestPokemon();
    benched.weakness = [{ type: CardType.WATER }];
    opponent.bench[0] = TestUtils.pokemonSlot([benched]);

    sim.dispatch(new AttackAction(1, 'Water Arrow'));

    const prompt = TestUtils.lastPrompt(sim) as ChoosePokemonPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.ACTIVE, SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.bench[0].damage).toEqual(20);
  });

  it('Should use Water Arrow - Active Pokemon, Weakness applied', () => {
    const { opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as PokemonCard).weakness = [{ type: CardType.WATER }];

    sim.dispatch(new AttackAction(1, 'Water Arrow'));

    const prompt = TestUtils.lastPrompt(sim) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.active]));

    expect(opponent.active.damage).toEqual(40);
  });

  // Waterfall (50)
  it('Should use Waterfall', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Waterfall'));

    expect(opponent.active.damage).toEqual(50);
  });

});
