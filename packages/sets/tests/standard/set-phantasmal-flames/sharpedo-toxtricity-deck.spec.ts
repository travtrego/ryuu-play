import {
  AttachEnergyPrompt,
  AttackAction,
  CardTag,
  CardType,
  ChooseCardsPrompt,
  PlayerType,
  ResolvePromptAction,
  RetreatAction,
  Simulator,
  SlotType,
  Stage,
  UseAbilityAction,
} from '@ptcg/common';

import { CarvanhaPFL } from '../../../src/standard/set-phantasmal-flames/carvanha';
import { MegaSharpedoEx } from '../../../src/standard/set-phantasmal-flames/mega-sharpedo-ex';
import { ToxelPFL } from '../../../src/standard/set-phantasmal-flames/toxel';
import { ToxtricityPFL } from '../../../src/standard/set-phantasmal-flames/toxtricity';
import { YveltalMEG } from '../../../src/standard/set-mega-evolution/yveltal';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class DarkPokemon extends TestPokemon {
  public cardTypes: CardType[] = [CardType.DARK];
}

describe('Mega Sharpedo ex / Toxtricity deck cards', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 5;
  });

  describe('printed stats', () => {
    it('Carvanha and Mega Sharpedo ex', () => {
      const carvanha = new CarvanhaPFL();
      expect([carvanha.stage, carvanha.hp, carvanha.cardTypes]).toEqual([Stage.BASIC, 70, [CardType.DARK]]);
      expect(carvanha.weakness).toEqual([{ type: CardType.GRASS }]);
      expect(carvanha.retreat).toEqual([CardType.COLORLESS]);

      const sharpedo = new MegaSharpedoEx();
      expect([sharpedo.stage, sharpedo.hp, sharpedo.evolvesFrom]).toEqual([Stage.STAGE_1, 330, 'Carvanha']);
      expect(sharpedo.tags).toEqual([CardTag.POKEMON_EX, CardTag.MEGA_EVOLUTION_EX]);
      expect(sharpedo.weakness).toEqual([{ type: CardType.GRASS }]);
      expect(sharpedo.retreat).toEqual([]);
      expect(sharpedo.attacks.map(a => a.cost)).toEqual([[CardType.DARK], [CardType.DARK, CardType.DARK]]);
    });

    it('Toxel, Toxtricity and Yveltal', () => {
      const toxel = new ToxelPFL();
      expect([toxel.stage, toxel.hp, toxel.cardTypes]).toEqual([Stage.BASIC, 70, [CardType.DARK]]);
      expect(toxel.weakness).toEqual([{ type: CardType.FIGHTING }]);
      expect(toxel.retreat).toEqual([CardType.COLORLESS]);

      const toxtricity = new ToxtricityPFL();
      expect([toxtricity.stage, toxtricity.hp, toxtricity.evolvesFrom]).toEqual([Stage.STAGE_1, 140, 'Toxel']);
      expect(toxtricity.weakness).toEqual([{ type: CardType.FIGHTING }]);
      expect(toxtricity.retreat).toEqual([CardType.COLORLESS, CardType.COLORLESS]);
      expect(toxtricity.attacks[0].cost).toEqual([CardType.DARK, CardType.DARK, CardType.COLORLESS]);

      const yveltal = new YveltalMEG();
      expect([yveltal.stage, yveltal.hp, yveltal.cardTypes]).toEqual([Stage.BASIC, 110, [CardType.DARK]]);
      expect(yveltal.weakness).toEqual([{ type: CardType.LIGHTNING }]);
      expect(yveltal.resistance).toEqual([{ type: CardType.FIGHTING, value: -30 }]);
      expect(yveltal.retreat).toEqual([]);
    });
  });

  describe('attacks', () => {
    it('Reckless Charge does 30 and 10 to Carvanha itself', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new CarvanhaPFL()], [CardType.DARK]);
      sim.dispatch(new AttackAction(1, 'Reckless Charge'));
      expect(opponent.active.damage).toEqual(30);
      expect(player.active.damage).toEqual(10);
    });

    it('Greedy Fang does 70 and draws 2 cards', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      player.deck.cards = TestUtils.makeTestCards(5);
      player.hand.cards = [];
      TestUtils.setActive(sim, [new CarvanhaPFL(), new MegaSharpedoEx()], [CardType.DARK]);
      sim.dispatch(new AttackAction(1, 'Greedy Fang'));
      expect(opponent.active.damage).toEqual(70);
      expect(player.hand.cards.length).toEqual(2);
      expect(player.deck.cards.length).toEqual(3);
    });

    it('Hungry Jaws does 120, or 270 when Mega Sharpedo ex has damage counters', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new CarvanhaPFL(), new MegaSharpedoEx()], [CardType.DARK, CardType.DARK]);
      sim.dispatch(new AttackAction(1, 'Hungry Jaws'));
      expect(opponent.active.damage).toEqual(120);

      const sim2 = TestUtils.createTestSimulator();
      sim2.store.state.turn = 5;
      const all = TestUtils.getAll(sim2);
      TestUtils.setActive(sim2, [new CarvanhaPFL(), new MegaSharpedoEx()], [CardType.DARK, CardType.DARK]);
      all.player.active.damage = 10;
      sim2.dispatch(new AttackAction(1, 'Hungry Jaws'));
      expect(all.opponent.active.damage).toEqual(270);
      expect(player.active.damage).toEqual(0);
    });

    it('Call for Family puts up to 2 Basic Pokémon from the deck onto the Bench', () => {
      const { player } = TestUtils.getAll(sim);
      const a = new CarvanhaPFL();
      const b = new ToxelPFL();
      const evolved = new MegaSharpedoEx();
      player.deck.cards = [a, evolved, b, ...TestUtils.makeTestCards(2)];
      TestUtils.setActive(sim, [new ToxelPFL()], [CardType.DARK]);
      sim.dispatch(new AttackAction(1, 'Call for Family'));
      const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
      expect(prompt instanceof ChooseCardsPrompt).toBeTrue();
      expect(prompt.options.max).toEqual(2);
      sim.dispatch(new ResolvePromptAction(prompt.id, [a, b]));
      expect(player.bench[0].getPokemonCard()).toBe(a);
      expect(player.bench[1].getPokemonCard()).toBe(b);
      expect(player.deck.cards.length).toEqual(3);
    });

    it('Gentle Slap does 100; Playful Kick does 20; Dark Feather does 110', () => {
      TestUtils.setActive(sim, [new ToxelPFL(), new ToxtricityPFL()], [CardType.DARK, CardType.DARK, CardType.COLORLESS]);
      sim.dispatch(new AttackAction(1, 'Gentle Slap'));
      expect(TestUtils.getAll(sim).opponent.active.damage).toEqual(100);

      const sim2 = TestUtils.createTestSimulator();
      sim2.store.state.turn = 5;
      TestUtils.setActive(sim2, [new ToxelPFL()], [CardType.DARK, CardType.COLORLESS]);
      sim2.dispatch(new AttackAction(1, 'Playful Kick'));
      expect(TestUtils.getAll(sim2).opponent.active.damage).toEqual(20);

      const sim3 = TestUtils.createTestSimulator();
      sim3.store.state.turn = 5;
      TestUtils.setActive(sim3, [new YveltalMEG()], [CardType.DARK, CardType.DARK, CardType.COLORLESS]);
      sim3.dispatch(new AttackAction(1, 'Dark Feather'));
      expect(TestUtils.getAll(sim3).opponent.active.damage).toEqual(110);
    });

    it('Clutch does 20 and the Defending Pokémon can\'t retreat during the opponent\'s next turn', () => {
      const { opponent } = TestUtils.getAll(sim);
      opponent.active.energies.cards = TestUtils.makeEnergies([CardType.COLORLESS]);
      opponent.bench[0].pokemons.cards = [new TestPokemon()];
      TestUtils.setActive(sim, [new YveltalMEG()], [CardType.DARK]);
      sim.dispatch(new AttackAction(1, 'Clutch'));
      expect(opponent.active.damage).toEqual(20);
      expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
      expect(() => sim.dispatch(new RetreatAction(2, 0))).toThrow();
    });

    it('after Dark Feather the Defending Pokémon can retreat', () => {
      const { opponent } = TestUtils.getAll(sim);
      const defending = opponent.active.getPokemonCard();
      opponent.active.energies.cards = TestUtils.makeEnergies([CardType.COLORLESS]);
      opponent.bench[0].pokemons.cards = [new TestPokemon()];
      TestUtils.setActive(sim, [new YveltalMEG()], [CardType.DARK, CardType.DARK, CardType.COLORLESS]);
      sim.dispatch(new AttackAction(1, 'Dark Feather'));
      sim.dispatch(new RetreatAction(2, 0));
      expect(opponent.bench[0].getPokemonCard()).toBe(defending);
    });
  });

  describe('Sinister Surge (Toxtricity)', () => {
    it('attaches a Basic D Energy from the deck to a Benched D Pokémon and puts 2 damage counters on it', () => {
      const { player } = TestUtils.getAll(sim);
      const [dark] = TestUtils.makeEnergies([CardType.DARK]);
      const [fire] = TestUtils.makeEnergies([CardType.FIRE]);
      player.deck.cards = [fire, ...TestUtils.makeTestCards(3), dark];
      player.bench[0].pokemons.cards = [new ToxelPFL(), new ToxtricityPFL()];
      player.bench[1].pokemons.cards = [new TestPokemon()];
      player.bench[2].pokemons.cards = [new DarkPokemon()];
      const target = TestUtils.target(sim, player.bench[0]);
      sim.dispatch(new UseAbilityAction(1, 'Sinister Surge', target));
      const prompt = TestUtils.lastPrompt(sim, player) as AttachEnergyPrompt;
      expect(prompt instanceof AttachEnergyPrompt).toBeTrue();
      expect(prompt.options.blockedTo).toContain({ player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 1 });
      expect(prompt.options.blockedTo).not.toContain({ player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 2 });
      sim.dispatch(new ResolvePromptAction(prompt.id, [
        { to: { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 2 }, card: dark },
      ]));
      expect(player.bench[2].energies.cards).toEqual([dark]);
      expect(player.bench[2].damage).toEqual(20);
      expect(player.deck.cards.length).toEqual(4);
      expect(() => sim.dispatch(new UseAbilityAction(1, 'Sinister Surge', target))).toThrow();
    });

    it('attaching nothing places no damage counters', () => {
      const { player } = TestUtils.getAll(sim);
      const [dark] = TestUtils.makeEnergies([CardType.DARK]);
      player.deck.cards = [dark];
      player.bench[0].pokemons.cards = [new ToxelPFL(), new ToxtricityPFL()];
      sim.dispatch(new UseAbilityAction(1, 'Sinister Surge', TestUtils.target(sim, player.bench[0])));
      const prompt = TestUtils.lastPrompt(sim, player) as AttachEnergyPrompt;
      sim.dispatch(new ResolvePromptAction(prompt.id, []));
      expect(player.bench[0].damage).toEqual(0);
      expect(player.deck.cards).toEqual([dark]);
    });

    it('can\'t be used without a Benched D Pokémon', () => {
      const { player } = TestUtils.getAll(sim);
      player.deck.cards = TestUtils.makeEnergies([CardType.DARK]);
      TestUtils.setActive(sim, [new ToxelPFL(), new ToxtricityPFL()]);
      player.bench[0].pokemons.cards = [new TestPokemon()];
      expect(() => sim.dispatch(new UseAbilityAction(1, 'Sinister Surge',
        TestUtils.target(sim, player.active)))).toThrow();
    });
  });
});
