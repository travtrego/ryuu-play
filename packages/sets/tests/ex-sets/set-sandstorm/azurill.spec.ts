import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  TrainerCard,
  TrainerType,
  UseAbilityAction,
} from '@ptcg/common';

import { Azurill } from '../../../src/ex-sets/set-sandstorm/azurill';
import { Marill } from '../../../src/ex-sets/set-sandstorm/marill';
import { TestCard } from '../../test-cards/test-card';
import { TestUtils } from '../../test-utils';

class TestItem extends TrainerCard {
  public trainerType: TrainerType = TrainerType.ITEM;
  public set = 'TEST';
  public name = 'Test Item';
  public fullName = 'Test Item TEST';
}

describe('Azurill SS', () => {
  let sim: Simulator;
  let azurill: Azurill;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    azurill = new Azurill();

    TestUtils.setActive(sim, [azurill], [CardType.COLORLESS]);
  });

  // Baby Evolution - Once during your turn (before your attack), you may put Marill from your hand onto Azurill
  // (this counts as evolving Azurill), and remove all damage counters from Azurill.
  it('Should use Baby Evolution to evolve into Marill and remove damage counters', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const marill = new Marill();
    player.hand.cards = [marill];
    player.active.damage = 30;

    sim.dispatch(new UseAbilityAction(1, 'Baby Evolution', TestUtils.target(sim, player.active)));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_EVOLVE,
      cards: player.hand,
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [marill]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.pokemons.cards).toEqual([azurill, marill]);
    expect(player.active.getPokemonCard()).toBe(marill);
    expect(player.active.damage).toEqual(0);
    expect(player.hand.cards).toEqual([]);
  });

  it('Should use Baby Evolution from the Bench', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const benched = new Azurill();
    const marill = new Marill();
    player.bench[0] = TestUtils.pokemonSlot([benched], [], [], 20);
    player.hand.cards = [marill];

    sim.dispatch(new UseAbilityAction(1, 'Baby Evolution', TestUtils.target(sim, player.bench[0])));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [marill]));

    expect(player.bench[0].pokemons.cards).toEqual([benched, marill]);
    expect(player.bench[0].damage).toEqual(0);
  });

  it('Should cancel Baby Evolution', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const marill = new Marill();
    player.hand.cards = [marill];
    player.active.damage = 30;

    sim.dispatch(new UseAbilityAction(1, 'Baby Evolution', TestUtils.target(sim, player.active)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.pokemons.cards).toEqual([azurill]);
    expect(player.active.damage).toEqual(30);
    expect(player.hand.cards).toEqual([marill]);
  });

  it('Should not use Baby Evolution without Marill in hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [new TestCard()];

    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Baby Evolution', TestUtils.target(sim, player.active)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_USE_POWER);
    expect(player.active.pokemons.cards).toEqual([azurill]);
  });

  // Jump Catch - Search your deck for a Trainer card, show it to your opponent, and put it into your hand. Shuffle
  // your deck afterward.
  it('Should use Jump Catch', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const item = new TestItem();
    const card = new TestCard();
    player.deck.cards = [card, item];

    sim.dispatch(new AttackAction(1, 'Jump Catch'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      cards: player.deck,
      options: jasmine.objectContaining({ min: 1, max: 1, allowCancel: true })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [item]));

    expect(prompts[1]).toEqual(jasmine.objectContaining({
      type: 'Show cards',
      playerId: opponent.id,
      cards: [item]
    }));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, true));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([item]);
    expect(player.deck.cards).toEqual([card]);
  });

  it('Should use Jump Catch and cancel', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const item = new TestItem();
    player.deck.cards = [item];

    sim.dispatch(new AttackAction(1, 'Jump Catch'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([]);
    expect(player.deck.cards).toEqual([item]);
  });

  it('Should use Jump Catch with an empty deck (attack still happens and does nothing)', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.deck.cards = [];

    let message = '';
    try {
      sim.dispatch(new AttackAction(1, 'Jump Catch'));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual('');
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([]);
  });
});
