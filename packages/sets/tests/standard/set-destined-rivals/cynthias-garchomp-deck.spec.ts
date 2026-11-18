import {
  AttackAction,
  CardTag,
  CardType,
  CheckHpEffect,
  ChooseCardsPrompt,
  ConfirmPrompt,
  ResolvePromptAction,
  ShowCardsPrompt,
  Simulator,
  Stage,
  UseAbilityAction,
  Weakness,
} from '@ptcg/common';

import { CynthiasGabite } from '../../../src/standard/set-destined-rivals/cynthias-gabite';
import { CynthiasGarchompEx } from '../../../src/standard/set-destined-rivals/cynthias-garchomp-ex';
import { CynthiasGible } from '../../../src/standard/set-destined-rivals/cynthias-gible';
import { CynthiasPowerWeight } from '../../../src/standard/set-destined-rivals/cynthias-power-weight';
import { CynthiasRoselia } from '../../../src/standard/set-destined-rivals/cynthias-roselia';
import { CynthiasRoserade } from '../../../src/standard/set-destined-rivals/cynthias-roserade';
import { CynthiasSpiritomb } from '../../../src/standard/set-destined-rivals/cynthias-spiritomb';
import { TestCard } from '../../test-cards/test-card';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

class Defender extends TestPokemon {
  public weakness: Weakness[] = [];
  public resistance: { type: CardType, value: number }[] = [];
  constructor(weakness?: CardType, resistance?: CardType) {
    super();
    if (weakness !== undefined) {
      this.weakness = [{ type: weakness }];
    }
    if (resistance !== undefined) {
      this.resistance = [{ type: resistance, value: -30 }];
    }
  }
}

describe('Cynthia\'s Garchomp ex deck cards', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 5;
  });

  describe('printed stats', () => {
    it('Gible, Gabite and Garchomp ex', () => {
      const gible = new CynthiasGible();
      expect([gible.stage, gible.hp, gible.cardTypes]).toEqual([Stage.BASIC, 70, [CardType.FIGHTING]]);
      expect(gible.weakness).toEqual([{ type: CardType.GRASS }]);
      expect(gible.retreat).toEqual([CardType.COLORLESS]);

      const gabite = new CynthiasGabite();
      expect([gabite.stage, gabite.hp, gabite.evolvesFrom]).toEqual([Stage.STAGE_1, 100, 'Cynthia\'s Gible']);
      expect(gabite.weakness).toEqual([{ type: CardType.GRASS }]);
      expect(gabite.retreat).toEqual([CardType.COLORLESS]);

      const garchomp = new CynthiasGarchompEx();
      expect([garchomp.stage, garchomp.hp, garchomp.evolvesFrom])
        .toEqual([Stage.STAGE_2, 330, 'Cynthia\'s Gabite']);
      expect(garchomp.tags).toContain(CardTag.POKEMON_EX);
      expect(garchomp.weakness).toEqual([{ type: CardType.GRASS }]);
      expect(garchomp.retreat).toEqual([]);
      expect(garchomp.attacks.map(a => a.cost)).toEqual([[CardType.FIGHTING],
        [CardType.FIGHTING, CardType.FIGHTING]]);
    });

    it('Roselia, Roserade and Spiritomb', () => {
      const roselia = new CynthiasRoselia();
      expect([roselia.stage, roselia.hp, roselia.cardTypes]).toEqual([Stage.BASIC, 70, [CardType.GRASS]]);
      expect(roselia.weakness).toEqual([{ type: CardType.FIRE }]);
      const roserade = new CynthiasRoserade();
      expect([roserade.stage, roserade.hp, roserade.evolvesFrom])
        .toEqual([Stage.STAGE_1, 130, 'Cynthia\'s Roselia']);
      expect(roserade.weakness).toEqual([{ type: CardType.FIRE }]);
      expect(roserade.retreat).toEqual([CardType.COLORLESS]);
      const spiritomb = new CynthiasSpiritomb();
      expect([spiritomb.stage, spiritomb.hp, spiritomb.cardTypes]).toEqual([Stage.BASIC, 70, [CardType.DARK]]);
      expect(spiritomb.weakness).toEqual([{ type: CardType.GRASS }]);
    });
  });

  describe('attacks', () => {
    it('Rock Hurl does 20 and ignores Resistance', () => {
      const { opponent } = TestUtils.getAll(sim);
      opponent.active.pokemons.cards = [new Defender(undefined, CardType.FIGHTING)];
      TestUtils.setActive(sim, [new CynthiasGible()], [CardType.FIGHTING]);
      sim.dispatch(new AttackAction(1, 'Rock Hurl'));
      expect(opponent.active.damage).toEqual(20);
    });

    it('Spike Sting does 20; Dragonslice does 40', () => {
      const { opponent } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new CynthiasRoselia()], [CardType.COLORLESS]);
      sim.dispatch(new AttackAction(1, 'Spike Sting'));
      expect(opponent.active.damage).toEqual(20);

      const sim2 = TestUtils.createTestSimulator();
      sim2.store.state.turn = 5;
      TestUtils.setActive(sim2, [new CynthiasGible(), new CynthiasGabite()], [CardType.FIGHTING]);
      sim2.dispatch(new AttackAction(1, 'Dragonslice'));
      expect(TestUtils.getAll(sim2).opponent.active.damage).toEqual(40);
    });

    it('Corkscrew Dive does 100 and may draw up to 6 cards in hand', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      player.hand.cards = [new TestCard(), new TestCard()];
      TestUtils.setActive(sim, [new CynthiasGarchompEx()], [CardType.FIGHTING]);
      sim.dispatch(new AttackAction(1, 'Corkscrew Dive'));
      const prompt = TestUtils.lastPrompt(sim, player) as ConfirmPrompt;
      expect(prompt instanceof ConfirmPrompt).toBeTrue();
      sim.dispatch(new ResolvePromptAction(prompt.id, true));
      expect(opponent.active.damage).toEqual(100);
      expect(player.hand.cards.length).toEqual(6);
    });

    it('Corkscrew Dive: you may decline to draw', () => {
      const { player } = TestUtils.getAll(sim);
      player.hand.cards = [];
      TestUtils.setActive(sim, [new CynthiasGarchompEx()], [CardType.FIGHTING]);
      sim.dispatch(new AttackAction(1, 'Corkscrew Dive'));
      const prompt = TestUtils.lastPrompt(sim, player) as ConfirmPrompt;
      sim.dispatch(new ResolvePromptAction(prompt.id, false));
      expect(player.hand.cards.length).toEqual(0);
    });

    it('Draconic Buster does 260 and discards all Energy from Garchomp', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new CynthiasGarchompEx()], [CardType.FIGHTING, CardType.FIGHTING, CardType.FIGHTING]);
      sim.dispatch(new AttackAction(1, 'Draconic Buster'));
      expect(opponent.active.damage).toEqual(260);
      expect(player.active.energies.cards.length).toEqual(0);
      expect(player.discard.cards.length).toEqual(3);
    });

    it('Raging Curse counts damage counters on Benched Cynthia\'s Pokémon only, ignoring Weakness', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      opponent.active.pokemons.cards = [new Defender(CardType.DARK)];
      player.bench[0] = TestUtils.pokemonSlot([new CynthiasGible()], [], [], 30);
      player.bench[1] = TestUtils.pokemonSlot([new CynthiasRoselia()], [], [], 20);
      player.bench[2] = TestUtils.pokemonSlot([new TestPokemon()], [], [], 50);
      TestUtils.setActive(sim, [new CynthiasSpiritomb()], [CardType.COLORLESS]);
      player.active.damage = 40;
      sim.dispatch(new AttackAction(1, 'Raging Curse'));
      expect(opponent.active.damage).toEqual(50);
    });
  });

  describe('Cheer On to Glory (Roserade)', () => {
    it('adds 30 per Roserade to Cynthia\'s Pokémon attacks on the Active, before Weakness', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      opponent.active.pokemons.cards = [new Defender(CardType.FIGHTING)];
      player.bench[0] = TestUtils.pokemonSlot([new CynthiasRoselia(), new CynthiasRoserade()]);
      player.bench[1] = TestUtils.pokemonSlot([new CynthiasRoselia(), new CynthiasRoserade()]);
      TestUtils.setActive(sim, [new CynthiasGible()], [CardType.FIGHTING]);
      sim.dispatch(new AttackAction(1, 'Rock Hurl'));
      expect(opponent.active.damage).toEqual((20 + 60) * 2);
    });

    it('does not help other Pokémon, and is off under an Ability lock', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      player.bench[0] = TestUtils.pokemonSlot([new CynthiasRoselia(), new CynthiasRoserade()]);
      sim.dispatch(new AttackAction(1, 'Test attack'));
      expect(opponent.active.damage).toEqual(10);

      const sim2 = TestUtils.createTestSimulator();
      sim2.store.state.turn = 5;
      const all = TestUtils.getAll(sim2);
      all.opponent.active.pokemons.cards = [new TestPokemonBlockPowers()];
      all.player.bench[0] = TestUtils.pokemonSlot([new CynthiasRoselia(), new CynthiasRoserade()]);
      TestUtils.setActive(sim2, [new CynthiasGible()], [CardType.FIGHTING]);
      sim2.dispatch(new AttackAction(1, 'Rock Hurl'));
      expect(all.opponent.active.damage).toEqual(20);
    });

    it('a Roserade in the hand does nothing', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      player.hand.cards = [new CynthiasRoserade()];
      TestUtils.setActive(sim, [new CynthiasGible()], [CardType.FIGHTING]);
      sim.dispatch(new AttackAction(1, 'Rock Hurl'));
      expect(opponent.active.damage).toEqual(20);
    });
  });

  describe('Champion\'s Call (Gabite)', () => {
    it('searches the deck for a Cynthia\'s Pokémon, once per turn', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      const garchomp = new CynthiasGarchompEx();
      const other = new TestPokemon();
      player.deck.cards = [other, new TestCard(), garchomp];
      TestUtils.setActive(sim, [new CynthiasGible(), new CynthiasGabite()]);
      sim.dispatch(new UseAbilityAction(1, 'Champion\'s Call', TestUtils.target(sim, player.active)));
      const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
      expect(prompt instanceof ChooseCardsPrompt).toBeTrue();
      expect(prompt.options.blocked).toEqual([0, 1]);
      sim.dispatch(new ResolvePromptAction(prompt.id, [garchomp]));
      const show = TestUtils.lastPrompt(sim, opponent) as ShowCardsPrompt;
      expect(show instanceof ShowCardsPrompt).toBeTrue();
      sim.dispatch(new ResolvePromptAction(show.id, true));
      expect(player.hand.cards).toEqual([garchomp]);
      expect(player.deck.cards.length).toEqual(2);
      expect(() => sim.dispatch(new UseAbilityAction(1, 'Champion\'s Call',
        TestUtils.target(sim, TestUtils.getAll(sim).player.active)))).toThrow();
    });

    it('with no Cynthia\'s Pokémon in the deck it just shuffles', () => {
      const { player } = TestUtils.getAll(sim);
      player.deck.cards = [new TestPokemon(), new TestCard()];
      TestUtils.setActive(sim, [new CynthiasGible(), new CynthiasGabite()]);
      sim.dispatch(new UseAbilityAction(1, 'Champion\'s Call', TestUtils.target(sim, player.active)));
      expect(player.hand.cards.length).toEqual(0);
      expect(player.deck.cards.length).toEqual(2);
    });
  });

  describe('Cynthia\'s Power Weight', () => {
    it('gives +70 HP to a Cynthia\'s Pokémon only', () => {
      const { player } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new CynthiasGible()], [], [new CynthiasPowerWeight()]);
      const check = new CheckHpEffect(player, player.active);
      sim.store.reduceEffect(sim.store.state, check);
      expect(check.hp).toEqual(140);

      player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [], [new CynthiasPowerWeight()]);
      const other = new CheckHpEffect(player, player.bench[0]);
      sim.store.reduceEffect(sim.store.state, other);
      expect(other.hp).toEqual(400);
    });
  });
});
