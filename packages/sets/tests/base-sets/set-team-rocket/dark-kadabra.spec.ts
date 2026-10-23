import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
  UseAbilityAction,
} from '@ptcg/common';

import { DarkKadabra } from '../../../src/base-sets/set-team-rocket/dark-kadabra';
import { Abra } from '../../../src/base-sets/set-team-rocket/abra';
import { TestCard } from '../../test-cards/test-card';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Dark Kadabra TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Abra(), new DarkKadabra()],
      [CardType.PSYCHIC, CardType.PSYCHIC]
    );
  });

  function useMatterExchange(): string {
    const { player } = TestUtils.getAll(sim);
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Matter Exchange', TestUtils.target(sim, player.active)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Matter Exchange - Once during your turn (before your attack), you may discard a card from your hand in order
  // to draw a card. This power can't be used if Dark Kadabra is Asleep, Confused, or Paralyzed.
  it('Should use Matter Exchange to discard a card and draw a card', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const x = new TestCard();
    const y = new TestCard();
    player.hand.cards = [x, y];
    const top = player.deck.cards[0];

    expect(useMatterExchange()).toEqual('');
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      options: jasmine.objectContaining({ min: 1, max: 1 }),
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [x]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.discard.cards).toEqual([x]);
    expect(player.hand.cards).toEqual([y, top]);
    expect(player.deck.cards.length).toEqual(49);
  });

  it('Should use Matter Exchange only once per turn', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.hand.cards = [new TestCard(), new TestCard()];

    useMatterExchange();
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.hand.cards[0]]));

    expect(useMatterExchange()).toEqual(GameMessage.POWER_ALREADY_USED);
  });

  it('Should be able to use Matter Exchange again after cancelling', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.hand.cards = [new TestCard()];

    useMatterExchange();
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(player.hand.cards.length).toEqual(1);
    expect(player.discard.cards).toEqual([]);
    expect(useMatterExchange()).toEqual('');
  });

  it('Should not use Matter Exchange with an empty hand', () => {
    expect(useMatterExchange()).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  it('Should use Matter Exchange from the Bench', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new Abra(), new DarkKadabra()]);
    TestUtils.setActive(sim, [new TestPokemon()]);
    player.hand.cards = [new TestCard()];

    sim.dispatch(new UseAbilityAction(1, 'Matter Exchange', TestUtils.target(sim, player.bench[0])));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.hand.cards[0]]));

    expect(player.discard.cards.length).toEqual(1);
    expect(player.hand.cards.length).toEqual(1);
  });

  [SpecialCondition.ASLEEP, SpecialCondition.CONFUSED, SpecialCondition.PARALYZED].forEach(condition => {
    it(`Should not use Matter Exchange when Dark Kadabra is ${SpecialCondition[condition]}`, () => {
      const { player, prompts } = TestUtils.getAll(sim);
      player.hand.cards = [new TestCard()];
      player.active.addSpecialCondition(condition);

      expect(useMatterExchange()).toEqual(GameMessage.CANNOT_USE_POWER);
      expect(prompts.length).toEqual(0);
    });
  });

  // Mind Shock (30) - Don't apply Weakness and Resistance for this attack.
  it('Should use Mind Shock without Weakness', () => {
    const { opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as TestPokemon).weakness = [{ type: CardType.PSYCHIC }];

    sim.dispatch(new AttackAction(1, 'Mind Shock'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Mind Shock without Resistance', () => {
    const { opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as TestPokemon).resistance = [{ type: CardType.PSYCHIC, value: -30 }];

    sim.dispatch(new AttackAction(1, 'Mind Shock'));

    expect(opponent.active.damage).toEqual(30);
  });
});
