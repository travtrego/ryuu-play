import {
  AttackAction,
  CardTag,
  CardType,
  ChooseAttackPrompt,
  ChooseCardsPrompt,
  PlayCardAction,
  ResolvePromptAction,
  ShowCardsPrompt,
  Simulator,
  TrainerCard,
  TrainerType,
} from '@ptcg/common';

import { TeamRocketsHonchkrow } from '../../../src/standard/set-ascended-heroes/team-rockets-honchkrow';
import { TeamRocketsArcher } from '../../../src/standard/set-destined-rivals/team-rockets-archer';
import { TeamRocketsGiovanni } from '../../../src/standard/set-destined-rivals/team-rockets-giovanni';
import { TeamRocketsMurkrow } from '../../../src/standard/set-destined-rivals/team-rockets-murkrow';
import { TeamRocketsPetrel } from '../../../src/standard/set-destined-rivals/team-rockets-petrel';
import { TeamRocketsPorygon } from '../../../src/standard/set-destined-rivals/team-rockets-porygon';
import { TeamRocketsPorygon2 } from '../../../src/standard/set-destined-rivals/team-rockets-porygon2';
import { RotoStick } from '../../../src/standard/set-prismatic-evolutions/roto-stick';
import { MiracleHeadset } from '../../../src/standard/set-surging-sparks/miracle-headset';
import { TestCard } from '../../test-cards/test-card';
import { TestUtils } from '../../test-utils';

class OtherSupporter extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;
  public set: string = 'TEST';
  public name: string = 'Other Supporter';
  public fullName: string = 'Other Supporter TEST';
}

describe('Team Rocket\'s Honchkrow deck cards', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 5;
  });

  describe('Team Rocket\'s Murkrow DRI', () => {
    it('has the printed stats', () => {
      const card = new TeamRocketsMurkrow();
      expect(card.hp).toEqual(80);
      expect(card.cardTypes).toEqual([CardType.DARK]);
      expect(card.weakness).toEqual([{ type: CardType.LIGHTNING }]);
      expect(card.resistance).toEqual([{ type: CardType.FIGHTING, value: -30 }]);
      expect(card.retreat.length).toEqual(1);
    });

    it('Deceit searches the deck for a Supporter', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      const supporter = new OtherSupporter();
      player.deck.cards = [new TestCard(), supporter, new TestCard()];
      TestUtils.setActive(sim, [new TeamRocketsMurkrow()], [CardType.COLORLESS]);
      sim.dispatch(new AttackAction(1, 'Deceit'));
      const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
      expect(prompt instanceof ChooseCardsPrompt).toBeTrue();
      sim.dispatch(new ResolvePromptAction(prompt.id, [supporter]));
      const show = TestUtils.lastPrompt(sim, opponent) as ShowCardsPrompt;
      expect(show instanceof ShowCardsPrompt).toBeTrue();
      sim.dispatch(new ResolvePromptAction(show.id, true));
      expect(player.hand.cards.indexOf(supporter)).not.toEqual(-1);
      expect(player.deck.cards.length).toEqual(2);
    });

    it('Torment does 30 and stops the chosen attack next turn', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new TeamRocketsMurkrow()], [CardType.DARK, CardType.COLORLESS]);
      sim.dispatch(new AttackAction(1, 'Torment'));
      const prompt = TestUtils.lastPrompt(sim, player) as ChooseAttackPrompt;
      expect(prompt instanceof ChooseAttackPrompt).toBeTrue();
      const attack = opponent.active.getPokemonCard()!.attacks[0];
      sim.dispatch(new ResolvePromptAction(prompt.id, attack));
      expect(opponent.active.damage).toEqual(30);
      expect(() => sim.dispatch(new AttackAction(2, 'Test attack'))).toThrow();
    });
  });

  describe('Team Rocket\'s Honchkrow ASC', () => {
    it('has the printed stats', () => {
      const card = new TeamRocketsHonchkrow();
      expect(card.hp).toEqual(130);
      expect(card.evolvesFrom).toEqual('Team Rocket\'s Murkrow');
      expect(card.weakness).toEqual([{ type: CardType.LIGHTNING }]);
      expect(card.resistance).toEqual([{ type: CardType.FIGHTING, value: -30 }]);
      expect(card.retreat.length).toEqual(1);
    });

    it('Rocket Feathers does 60 for each Team Rocket Supporter discarded', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      const petrel = new TeamRocketsPetrel();
      const giovanni = new TeamRocketsGiovanni();
      const other = new OtherSupporter();
      player.hand.cards = [petrel, other, giovanni];
      TestUtils.setActive(sim, [new TeamRocketsHonchkrow()], [CardType.COLORLESS, CardType.COLORLESS]);
      sim.dispatch(new AttackAction(1, 'Rocket Feathers'));
      const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
      expect(prompt.options.blocked).toEqual([1]);
      expect(prompt.options.max).toEqual(2);
      sim.dispatch(new ResolvePromptAction(prompt.id, [petrel, giovanni]));
      expect(opponent.active.damage).toEqual(120);
      expect(player.hand.cards).toEqual([other]);
      expect(player.discard.cards).toContain(petrel);
    });

    it('Rocket Feathers does nothing without Team Rocket Supporters', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      player.hand.cards = [new OtherSupporter()];
      TestUtils.setActive(sim, [new TeamRocketsHonchkrow()], [CardType.COLORLESS, CardType.COLORLESS]);
      sim.dispatch(new AttackAction(1, 'Rocket Feathers'));
      expect(opponent.active.damage).toEqual(0);
    });

    it('Hammer In does 100', () => {
      const { opponent } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new TeamRocketsHonchkrow()], [CardType.DARK, CardType.COLORLESS, CardType.COLORLESS]);
      sim.dispatch(new AttackAction(1, 'Hammer In'));
      expect(opponent.active.damage).toEqual(100);
    });
  });

  describe('Team Rocket\'s Porygon / Porygon2 DRI', () => {
    it('Hacking: you discard a card, then the opponent discards a card', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      const mine = new TestCard();
      const theirs = new TestCard();
      player.hand.cards = [mine];
      opponent.hand.cards = [theirs, new TestCard()];
      TestUtils.setActive(sim, [new TeamRocketsPorygon()], [CardType.COLORLESS]);
      sim.dispatch(new AttackAction(1, 'Hacking'));
      let prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
      sim.dispatch(new ResolvePromptAction(prompt.id, [mine]));
      prompt = TestUtils.lastPrompt(sim, opponent) as ChooseCardsPrompt;
      expect(prompt.playerId).toEqual(opponent.id);
      sim.dispatch(new ResolvePromptAction(prompt.id, [theirs]));
      expect(player.discard.cards).toEqual([mine]);
      expect(opponent.discard.cards).toEqual([theirs]);
      // 1 left + the card drawn at the start of the opponent's turn
      expect(opponent.hand.cards.length).toEqual(2);
    });

    it('Hacking with an empty hand makes nobody discard', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      player.hand.cards = [];
      opponent.hand.cards = [new TestCard()];
      TestUtils.setActive(sim, [new TeamRocketsPorygon()], [CardType.COLORLESS]);
      sim.dispatch(new AttackAction(1, 'Hacking'));
      expect(opponent.discard.cards.length).toEqual(0);
    });

    it('R Command does 20 for each Team Rocket Supporter in the discard pile', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      player.discard.cards = [new TeamRocketsPetrel(), new OtherSupporter(), new TeamRocketsGiovanni(),
        new TeamRocketsArcher()];
      const porygon2 = new TeamRocketsPorygon2();
      expect(porygon2.evolvesFrom).toEqual('Team Rocket\'s Porygon');
      expect(porygon2.hp).toEqual(90);
      TestUtils.setActive(sim, [porygon2], [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]);
      sim.dispatch(new AttackAction(1, 'R Command'));
      expect(opponent.active.damage).toEqual(60);
    });
  });

  describe('Team Rocket\'s Archer DRI', () => {
    it('needs a Team Rocket\'s Pokémon Knocked Out last turn', () => {
      const { player } = TestUtils.getAll(sim);
      player.hand.cards = [new TeamRocketsArcher()];
      player.knockedOutTurn = 4;
      player.knockedOutNames = ['Pokemon'];
      expect(() => sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)))).toThrow();
      player.knockedOutTurn = 3;
      player.knockedOutNames = ['Team Rocket\'s Murkrow'];
      expect(() => sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)))).toThrow();
    });

    it('shuffles both hands in; you draw 5, the opponent draws 3', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      player.knockedOutTurn = 4;
      player.knockedOutNames = ['Pokemon', 'Team Rocket\'s Murkrow'];
      player.hand.cards = [new TeamRocketsArcher(), ...TestUtils.makeTestCards(2)];
      opponent.hand.cards = TestUtils.makeTestCards(7);
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
      expect(player.hand.cards.length).toEqual(5);
      expect(opponent.hand.cards.length).toEqual(3);
      expect(opponent.deck.cards.length).toEqual(50 + 7 - 3);
    });
  });

  describe('Roto-Stick PRE', () => {
    it('takes any number of Supporters from the top 4 cards', () => {
      const { player } = TestUtils.getAll(sim);
      const s1 = new OtherSupporter();
      const s2 = new TeamRocketsPetrel();
      const s5 = new OtherSupporter();
      player.deck.cards = [s1, new TestCard(), s2, new TestCard(), s5];
      player.hand.cards = [new RotoStick()];
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
      const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
      expect(prompt.cards.cards.length).toEqual(4);
      expect(prompt.cards.cards.indexOf(s5)).toEqual(-1);
      sim.dispatch(new ResolvePromptAction(prompt.id, [s1, s2]));
      expect(player.hand.cards.length).toEqual(2);
      expect(player.hand.cards[0]).toBe(s1);
      expect(player.hand.cards[1]).toBe(s2);
      expect(player.deck.cards.length).toEqual(3);
    });
  });

  describe('Miracle Headset SSP', () => {
    it('is an ACE SPEC Item', () => {
      const card = new MiracleHeadset();
      expect(card.tags).toContain(CardTag.ACE_SPEC);
      expect(card.trainerType).toEqual(TrainerType.ITEM);
    });

    it('can\'t be played without a Supporter in the discard pile', () => {
      const { player } = TestUtils.getAll(sim);
      player.hand.cards = [new MiracleHeadset()];
      player.discard.cards = [new TestCard()];
      expect(() => sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)))).toThrow();
    });

    it('puts up to 2 Supporters from the discard pile into the hand', () => {
      const { player } = TestUtils.getAll(sim);
      const s1 = new OtherSupporter();
      const s2 = new TeamRocketsGiovanni();
      player.hand.cards = [new MiracleHeadset()];
      player.discard.cards = [s1, new TestCard(), s2, new TeamRocketsPetrel()];
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
      const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
      expect(prompt.options.max).toEqual(2);
      sim.dispatch(new ResolvePromptAction(prompt.id, [s1, s2]));
      expect(player.hand.cards).toEqual([s1, s2]);
    });
  });
});
