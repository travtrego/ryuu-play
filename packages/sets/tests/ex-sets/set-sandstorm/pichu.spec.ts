import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SlotType,
  UseAbilityAction,
} from '@ptcg/common';

import { MultiEnergy } from '../../../src/ex-sets/set-sandstorm/multi-energy';
import { Pichu } from '../../../src/ex-sets/set-sandstorm/pichu';
import { Pikachu } from '../../../src/ex-sets/set-sandstorm/pikachu';
import { TestCard } from '../../test-cards/test-card';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Pichu SS', () => {
  let sim: Simulator;
  let pichu: Pichu;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    pichu = new Pichu();

    TestUtils.setActive(sim, [pichu], [CardType.LIGHTNING]);
  });

  // Baby Evolution - Once during your turn (before your attack), you may put Pikachu from your hand onto Pichu (this
  // counts as evolving Pichu) and remove all damage counters from Pichu.
  it('Should use Baby Evolution to evolve into Pikachu and remove damage counters', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const pikachu = new Pikachu();
    player.hand.cards = [pikachu];
    player.active.damage = 30;

    sim.dispatch(new UseAbilityAction(1, 'Baby Evolution', TestUtils.target(sim, player.active)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_EVOLVE,
      cards: player.hand,
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [pikachu]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.pokemons.cards).toEqual([pichu, pikachu]);
    expect(player.active.damage).toEqual(0);
    expect(player.hand.cards).toEqual([]);
  });

  it('Should cancel Baby Evolution', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const pikachu = new Pikachu();
    player.hand.cards = [pikachu];
    player.active.damage = 30;

    sim.dispatch(new UseAbilityAction(1, 'Baby Evolution', TestUtils.target(sim, player.active)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(player.active.pokemons.cards).toEqual([pichu]);
    expect(player.active.damage).toEqual(30);
  });

  it('Should not use Baby Evolution without Pikachu in hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [new TestCard()];

    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Baby Evolution', TestUtils.target(sim, player.active)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  // Energy Retrieval - Search your discard pile for up to 2 basic Energy cards and attach them to 1 of your Pokémon.
  // Put 1 damage counter on that Pokémon for each Energy card attached in this way.
  it('Should use Energy Retrieval and attach 2 basic Energy cards', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const [water, fire] = TestUtils.makeEnergies([CardType.WATER, CardType.FIRE]);
    const multi = new MultiEnergy();
    player.discard.cards = [water, multi, fire];
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Energy Retrieval'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Attach energy',
      playerId: player.id,
      cardList: player.discard,
      slots: [SlotType.ACTIVE, SlotType.BENCH],
      options: jasmine.objectContaining({ min: 0, max: 2, sameTarget: true })
    }));
    const to = TestUtils.target(sim, player.bench[0]);
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [{ card: water, to }, { card: fire, to }]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.bench[0].energies.cards).toEqual([water, fire]);
    expect(player.bench[0].damage).toEqual(20);
    expect(player.discard.cards).toEqual([multi]);
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Energy Retrieval and attach 1 basic Energy card to Pichu', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const [water] = TestUtils.makeEnergies([CardType.WATER]);
    player.discard.cards = [water];

    sim.dispatch(new AttackAction(1, 'Energy Retrieval'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [{ card: water, to: TestUtils.target(sim, player.active) }]));

    expect(player.active.energies.cards.length).toEqual(2);
    expect(player.active.damage).toEqual(10);
  });

  it('Should use Energy Retrieval without basic Energy in the discard pile', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    player.discard.cards = [new MultiEnergy()];

    sim.dispatch(new AttackAction(1, 'Energy Retrieval'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.damage).toEqual(0);
  });
});
