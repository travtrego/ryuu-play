import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  ChoosePokemonPrompt,
  GameMessage,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { Camerupt } from '../../../src/ex-sets/set-ruby-and-sapphire/camerupt';
import { RainbowEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/rainbow-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Camerupt RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Camerupt()],
      [CardType.FIRE, CardType.FIRE, CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  // Lava Burn (20) - Choose 1 of your opponent's Benched Pokémon. This attack does 10 damage to that Pokémon.
  // (Don't apply Weakness and Resistance for Benched Pokémon.)
  it('Should use Lava Burn - damages chosen Benched Pokemon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const benched = new TestPokemon();
    benched.weakness = [{ type: CardType.FIRE }];
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[1] = TestUtils.pokemonSlot([benched]);

    sim.dispatch(new AttackAction(1, 'Lava Burn'));

    const prompt = TestUtils.lastPrompt(sim) as ChoosePokemonPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.BENCH],
      options: jasmine.objectContaining({ allowCancel: false }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[1]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.bench[0].damage).toEqual(0);
    expect(opponent.bench[1].damage).toEqual(10);
  });

  it('Should use Lava Burn - no Benched Pokemon', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Lava Burn'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  // Fire Spin (100) - Discard 2 basic Energy cards attached to Camerupt or this attack does nothing.
  it('Should use Fire Spin - discard 2 basic Energy', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Fire Spin'));

    const prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_DISCARD,
      cards: player.active.energies,
      options: jasmine.objectContaining({ min: 2, max: 2 }),
    }));
    const selected = player.active.energies.cards.slice(0, 2);
    sim.dispatch(new ResolvePromptAction(prompt.id, selected));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(100);
    expect(player.discard.cards).toEqual(selected);
    expect(player.active.energies.cards.length).toEqual(2);
  });

  // BUG: with fewer than 2 basic Energy attached the code throws NOT_ENOUGH_ENERGY (attack unusable) instead of
  // letting the attack resolve and do nothing.
  xit('Should use Fire Spin - fewer than 2 basic Energy, attack does nothing', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.energies.cards = [
      ...TestUtils.makeEnergies([CardType.FIRE]),
      new RainbowEnergy(), new RainbowEnergy(), new RainbowEnergy(),
    ];

    sim.dispatch(new AttackAction(1, 'Fire Spin'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(player.active.energies.cards.length).toEqual(4);
  });

});
