import {
  AttachEnergyPrompt,
  AttackAction,
  CardTag,
  CardType,
  ChooseCardsPrompt,
  ConfirmPrompt,
  EnergyType,
  PlayCardAction,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
  Stage,
} from '@ptcg/common';

import { CrushingHammerPOR } from '../../../src/standard/set-perfect-order/crushing-hammer';
import { Judge } from '../../../src/standard/set-perfect-order/judge';
import { MeowthEx } from '../../../src/standard/set-perfect-order/meowth-ex';
import { PokePad } from '../../../src/standard/set-perfect-order/poke-pad';
import { RosasEncouragement } from '../../../src/standard/set-perfect-order/rosas-encouragement';
import { TestCard } from '../../test-cards/test-card';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestEnergy } from '../../test-cards/test-energy';
import { TestUtils } from '../../test-utils';

class TestSupporter extends TestCard {}

class Stage2Pokemon extends TestPokemon {
  public stage = Stage.STAGE_2;
}

class ExPokemon extends TestPokemon {
  public tags = [CardTag.POKEMON_EX];
}

const bench = (index: number) => ({ player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index });

describe('Perfect Order cards', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  describe('Meowth ex POR', () => {
    it('Should have the printed stats', () => {
      const card = new MeowthEx();
      expect([card.hp, card.cardTypes[0], card.retreat.length]).toEqual([170, CardType.COLORLESS, 1]);
      expect(card.tags).toContain(CardTag.POKEMON_EX);
      expect(card.weakness).toEqual([{ type: CardType.FIGHTING }]);
    });

    it('Last-Ditch Catch: playing it onto the Bench may search for a Supporter, once per turn', () => {
      const { player } = TestUtils.getAll(sim);
      const meowth1 = new MeowthEx();
      const meowth2 = new MeowthEx();
      const supporter = new TestSupporter();
      (supporter as any).superType = 2;
      (supporter as any).trainerType = 1;
      player.hand.cards = [meowth1, meowth2];
      player.deck.cards = [supporter, ...TestUtils.makeTestCards(5)];

      sim.dispatch(new PlayCardAction(1, 0, bench(0)));
      const confirm = TestUtils.lastPrompt(sim, player) as ConfirmPrompt;
      expect(confirm instanceof ConfirmPrompt).toBeTrue();
      sim.dispatch(new ResolvePromptAction(confirm.id, true));
      const choose = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
      expect(choose instanceof ChooseCardsPrompt).toBeTrue();
      sim.dispatch(new ResolvePromptAction(choose.id, [supporter]));
      const { opponent } = TestUtils.getAll(sim);
      const show = TestUtils.lastPrompt(sim, opponent)!;
      sim.dispatch(new ResolvePromptAction(show.id, true));
      expect(player.hand.cards).toContain(supporter);
      expect(player.bench[0].getPokemonCard()).toBe(meowth1);

      // A second "Last-Ditch" Ability this turn doesn't trigger.
      const promptsBefore = sim.store.state.prompts.length;
      sim.dispatch(new PlayCardAction(1, player.hand.cards.indexOf(meowth2), bench(1)));
      expect(player.bench[1].getPokemonCard()).toBe(meowth2);
      expect(sim.store.state.prompts.length).toEqual(promptsBefore);
    });

    it('Tuck Tail does 60, then puts Meowth ex and its cards into the hand', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      const meowth = new MeowthEx();
      TestUtils.setActive(sim, [meowth], [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]);
      player.bench[0].pokemons.cards = [new TestPokemon()];
      sim.dispatch(new AttackAction(1, 'Tuck Tail'));
      expect(opponent.active.damage).toEqual(60);
      expect(player.hand.cards).toContain(meowth);
      expect(player.hand.cards.length).toBeGreaterThanOrEqual(4);
      expect(player.active.getPokemonCard()).not.toBe(meowth);
    });
  });

  describe('Judge POR', () => {
    it('each player shuffles their hand in and draws 4', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      player.hand.cards = [new Judge(), ...TestUtils.makeTestCards(1)];
      opponent.hand.cards = TestUtils.makeTestCards(8);
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
      expect(player.hand.cards.length).toEqual(4);
      expect(opponent.hand.cards.length).toEqual(4);
      expect(player.supporter.cards.length + player.discard.cards.length).toBeGreaterThan(0);
    });
  });

  describe('Poké Pad POR', () => {
    it('finds a Pokémon without a Rule Box; Pokémon ex are blocked', () => {
      const { player } = TestUtils.getAll(sim);
      const plain = new TestPokemon();
      const ex = new ExPokemon();
      player.hand.cards = [new PokePad()];
      player.deck.cards = [ex, plain, ...TestUtils.makeTestCards(3)];
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
      const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
      expect(prompt.options.blocked).toEqual([0]);
      expect(prompt.validate([ex])).toBeFalse();
      sim.dispatch(new ResolvePromptAction(prompt.id, [plain]));
      expect(player.hand.cards).toEqual([plain]);
    });
  });

  describe('Crushing Hammer POR', () => {
    it('is the Crushing Hammer EPO effect under the POR printing', () => {
      const card = new CrushingHammerPOR();
      expect(card.fullName).toEqual('Crushing Hammer POR');
      expect(card.name).toEqual('Crushing Hammer');
    });
  });

  describe('Rosa\'s Encouragement POR', () => {
    it('can\'t be played unless you have more Prize cards left than the opponent', () => {
      const { player } = TestUtils.getAll(sim);
      player.hand.cards = [new RosasEncouragement()];
      player.discard.cards = [new TestEnergy(CardType.FIRE)];
      player.bench[0].pokemons.cards = [new Stage2Pokemon()];
      expect(() => sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)))).toThrow();
    });

    it('attaches up to 2 basic Energy from the discard pile to 1 Stage 2 Pokémon', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      opponent.prizes[0].cards = [];
      const fire = new TestEnergy(CardType.FIRE);
      const psychic = new TestEnergy(CardType.PSYCHIC);
      player.hand.cards = [new RosasEncouragement()];
      player.discard.cards = [fire, psychic];
      player.bench[0].pokemons.cards = [new Stage2Pokemon()];
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
      const prompt = TestUtils.lastPrompt(sim, player) as AttachEnergyPrompt;
      expect(prompt instanceof AttachEnergyPrompt).toBeTrue();
      expect(prompt.options.sameTarget).toBeTrue();
      expect(prompt.options.blockedTo.length).toEqual(1); // the Active is not Stage 2
      expect((prompt.filter as any).energyType).toEqual(EnergyType.BASIC);
      sim.dispatch(new ResolvePromptAction(prompt.id, [
        { to: bench(0), card: fire }, { to: bench(0), card: psychic }
      ]));
      expect(player.bench[0].energies.cards).toEqual([fire, psychic]);
    });
  });
});
