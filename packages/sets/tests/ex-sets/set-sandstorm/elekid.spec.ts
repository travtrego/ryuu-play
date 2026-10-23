import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SlotType,
  UseAbilityAction,
} from '@ptcg/common';

import { Electabuzz } from '../../../src/ex-sets/set-sandstorm/electabuzz';
import { Elekid } from '../../../src/ex-sets/set-sandstorm/elekid';
import { TestCard } from '../../test-cards/test-card';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Elekid SS', () => {
  let sim: Simulator;
  let elekid: Elekid;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    elekid = new Elekid();

    TestUtils.setActive(sim, [elekid], [CardType.LIGHTNING]);
  });

  // Baby Evolution - Once during your turn (before your attack), you may put Electabuzz from your hand onto Elekid
  // (this counts as evolving Elekid) and remove all damage counters from Elekid.
  it('Should use Baby Evolution to evolve into Electabuzz and remove damage counters', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const electabuzz = new Electabuzz();
    player.hand.cards = [electabuzz];
    player.active.damage = 30;

    sim.dispatch(new UseAbilityAction(1, 'Baby Evolution', TestUtils.target(sim, player.active)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_EVOLVE,
      cards: player.hand,
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [electabuzz]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.pokemons.cards).toEqual([elekid, electabuzz]);
    expect(player.active.damage).toEqual(0);
    expect(player.hand.cards).toEqual([]);
  });

  it('Should cancel Baby Evolution', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const electabuzz = new Electabuzz();
    player.hand.cards = [electabuzz];
    player.active.damage = 30;

    sim.dispatch(new UseAbilityAction(1, 'Baby Evolution', TestUtils.target(sim, player.active)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(player.active.pokemons.cards).toEqual([elekid]);
    expect(player.active.damage).toEqual(30);
  });

  it('Should not use Baby Evolution without Electabuzz in hand', () => {
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

  // Gather Energy - Search your deck for a basic Energy card and attach it to 1 of your Pokémon. Shuffle your deck
  // afterward.
  it('Should use Gather Energy and attach a basic Energy to a Benched Pokémon', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const [energy] = TestUtils.makeEnergies([CardType.WATER]);
    const card = new TestCard();
    player.deck.cards = [card, energy];
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Gather Energy'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Attach energy',
      playerId: player.id,
      cardList: player.deck,
      slots: [SlotType.ACTIVE, SlotType.BENCH],
      options: jasmine.objectContaining({ min: 1, max: 1 })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [{ card: energy, to: TestUtils.target(sim, player.bench[0]) }]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.bench[0].energies.cards).toEqual([energy]);
    expect(player.deck.cards).toEqual([card]);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Gather Energy with an empty deck', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    player.deck.cards = [];

    sim.dispatch(new AttackAction(1, 'Gather Energy'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
  });
});
