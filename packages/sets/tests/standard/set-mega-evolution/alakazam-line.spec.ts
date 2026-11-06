import {
  AttackAction,
  CardManager,
  CardType,
  ChoosePokemonPrompt,
  ConfirmPrompt,
  PlayCardAction,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
  Stage,
} from '@ptcg/common';

import { Abra } from '../../../src/standard/set-mega-evolution/abra';
import { Alakazam } from '../../../src/standard/set-mega-evolution/alakazam';
import { Kadabra } from '../../../src/standard/set-mega-evolution/kadabra';
import { RareCandyMEG } from '../../../src/standard/set-mega-evolution/rare-candy';
import { setMegaEvolution } from '../../../src/standard/set-mega-evolution';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class DarkWeakPokemon extends TestPokemon {
  public weakness = [{ type: CardType.PSYCHIC }];
}

describe('Abra / Kadabra / Alakazam MEG', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 5;
  });

  it('Should have the printed stats', () => {
    const abra = new Abra();
    const kadabra = new Kadabra();
    const alakazam = new Alakazam();
    expect([abra.hp, kadabra.hp, alakazam.hp]).toEqual([50, 80, 140]);
    expect([kadabra.stage, kadabra.evolvesFrom, alakazam.stage, alakazam.evolvesFrom])
      .toEqual([Stage.STAGE_1, 'Abra', Stage.STAGE_2, 'Kadabra']);
    [abra, kadabra, alakazam].forEach(c => {
      expect(c.weakness).toEqual([{ type: CardType.DARK }]);
      expect(c.resistance).toEqual([{ type: CardType.FIGHTING, value: -30 }]);
      expect(c.retreat.length).toEqual(1);
    });
  });

  it('Teleportation Attack does its damage from Abra, then switches Abra with a Benched Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const abra = new Abra();
    TestUtils.setActive(sim, [abra], [CardType.PSYCHIC]);
    opponent.active.pokemons.cards = [new DarkWeakPokemon()];
    const benched = new TestPokemon();
    player.bench[0].pokemons.cards = [benched];
    sim.dispatch(new AttackAction(1, 'Teleportation Attack'));
    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [player.bench[0]]));
    expect(opponent.active.damage).toEqual(20); // Weakness from Abra's type
    expect(player.active.getPokemonCard()).toBe(benched);
    expect(player.bench[0].getPokemonCard()).toBe(abra);
  });

  it('Psychic Draw: evolving into Kadabra from the hand may draw 2', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.pokemons.cards = [new Abra()];
    player.active.pokemonPlayedTurn = 1;
    player.hand.cards = [new Kadabra()];
    sim.dispatch(new PlayCardAction(1, 0, { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 }));
    const confirm = TestUtils.lastPrompt(sim, player) as ConfirmPrompt;
    expect(confirm instanceof ConfirmPrompt).toBeTrue();
    sim.dispatch(new ResolvePromptAction(confirm.id, true));
    expect(player.active.getPokemonCard() instanceof Kadabra).toBeTrue();
    expect(player.hand.cards.length).toEqual(2);
  });

  it('Psychic Draw also works through Rare Candy (Alakazam draws 3)', () => {
    // Rare Candy looks the Stage 1 card up in the CardManager.
    CardManager.getInstance().defineSet(setMegaEvolution);
    const { player } = TestUtils.getAll(sim);
    player.active.pokemons.cards = [new Abra()];
    player.active.pokemonPlayedTurn = 1;
    const alakazam = new Alakazam();
    player.hand.cards = [new RareCandyMEG(), alakazam];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    let prompt = TestUtils.lastPrompt(sim, player)!;
    // Rare Candy asks for the Basic Pokémon (and the Stage 2 card when there are several).
    while (!(prompt instanceof ConfirmPrompt)) {
      const result = prompt instanceof ChoosePokemonPrompt ? [player.active] : [alakazam];
      sim.dispatch(new ResolvePromptAction(prompt.id, result));
      prompt = TestUtils.lastPrompt(sim, player)!;
    }
    sim.dispatch(new ResolvePromptAction(prompt.id, true));
    expect(player.active.getPokemonCard() instanceof Alakazam).toBeTrue();
    expect(player.hand.cards.length).toEqual(3);
  });

  it('Powerful Hand: 2 damage counters on the opponent\'s Active for each card in your hand', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Abra(), new Kadabra(), new Alakazam()], [CardType.PSYCHIC]);
    opponent.active.pokemons.cards = [new DarkWeakPokemon()];
    player.hand.cards = TestUtils.makeTestCards(6);
    sim.dispatch(new AttackAction(1, 'Powerful Hand'));
    expect(opponent.active.damage).toEqual(120); // counters: no Weakness
  });
});
