import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  Stage,
  UseAbilityAction,
} from '@ptcg/common';

import { Wobbuffet } from '../../../src/ex-sets/set-sandstorm/wobbuffet';
import { Wynaut } from '../../../src/ex-sets/set-sandstorm/wynaut';
import { TestCard } from '../../test-cards/test-card';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Wynaut SS', () => {
  let sim: Simulator;
  let wynaut: Wynaut;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    wynaut = new Wynaut();

    TestUtils.setActive(sim, [wynaut], [CardType.PSYCHIC, CardType.COLORLESS]);
  });

  // Baby Evolution - Once during your turn (before your attack), you may put Wobbuffet from your hand onto Wynaut
  // (this counts as evolving Wynaut), and remove all damage counters from Wynaut.
  it('Should use Baby Evolution to evolve into Wobbuffet and remove damage counters', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const wobbuffet = new Wobbuffet();
    player.hand.cards = [wobbuffet];
    player.active.damage = 30;

    sim.dispatch(new UseAbilityAction(1, 'Baby Evolution', TestUtils.target(sim, player.active)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_EVOLVE,
      cards: player.hand,
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [wobbuffet]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.pokemons.cards).toEqual([wynaut, wobbuffet]);
    expect(player.active.damage).toEqual(0);
    expect(player.hand.cards).toEqual([]);
  });

  it('Should cancel Baby Evolution', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const wobbuffet = new Wobbuffet();
    player.hand.cards = [wobbuffet];
    player.active.damage = 30;

    sim.dispatch(new UseAbilityAction(1, 'Baby Evolution', TestUtils.target(sim, player.active)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(player.active.pokemons.cards).toEqual([wynaut]);
    expect(player.active.damage).toEqual(30);
  });

  it('Should not use Baby Evolution without Wobbuffet in hand', () => {
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

  // Alluring Smile - Search your deck for a Basic Pokémon card or Evolution card for each Energy attached to Wynaut,
  // show them to your opponent, and put them into your hand. Shuffle your deck afterward.
  it('Should use Alluring Smile and take a Pokémon for each Energy', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const basic = new TestPokemon();
    const stage1 = new TestPokemon();
    stage1.stage = Stage.STAGE_1;
    const card = new TestCard();
    player.deck.cards = [basic, card, stage1];

    sim.dispatch(new AttackAction(1, 'Alluring Smile'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      cards: player.deck,
      options: jasmine.objectContaining({ min: 0, max: 2, allowCancel: true })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [basic, stage1]));

    expect(prompts[1]).toEqual(jasmine.objectContaining({
      type: 'Show cards',
      playerId: opponent.id,
      cards: [basic, stage1]
    }));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, true));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([basic, stage1]);
    expect(player.deck.cards).toEqual([card]);
  });

  it('Should use Alluring Smile with 1 Energy attached', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.active.energies.cards = TestUtils.makeEnergies([CardType.PSYCHIC]);

    sim.dispatch(new AttackAction(1, 'Alluring Smile'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      options: jasmine.objectContaining({ max: 1 })
    }));
  });

  it('Should use Alluring Smile with an empty deck', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    player.deck.cards = [];

    sim.dispatch(new AttackAction(1, 'Alluring Smile'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
  });
});
