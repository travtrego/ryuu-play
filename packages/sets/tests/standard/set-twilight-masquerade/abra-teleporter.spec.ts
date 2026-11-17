import {
  CardType,
  EnergyType,
  ChoosePokemonPrompt,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
  Stage,
  UseAbilityAction,
} from '@ptcg/common';

import { AbraTWM } from '../../../src/standard/set-twilight-masquerade/abra';
import { EnhancedHammerTWM } from '../../../src/standard/set-twilight-masquerade/enhanced-hammer';
import { TestEnergy } from '../../test-cards/test-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Abra TWM', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  it('has the printed stats', () => {
    const abra = new AbraTWM();
    expect([abra.name, abra.stage, abra.hp, abra.cardTypes]).toEqual(['Abra', Stage.BASIC, 40, [CardType.PSYCHIC]]);
    expect(abra.weakness).toEqual([{ type: CardType.DARK }]);
    expect(abra.resistance).toEqual([{ type: CardType.FIGHTING, value: -30 }]);
    expect(abra.retreat).toEqual([CardType.COLORLESS]);
    expect(abra.attacks.map(a => [a.name, a.cost, a.damage])).toEqual([['Beam', [CardType.PSYCHIC], '10']]);
  });

  it('Teleporter shuffles the Active Abra and its cards into the deck; a Benched Pokémon comes up', () => {
    const { player } = TestUtils.getAll(sim);
    const abra = new AbraTWM();
    TestUtils.setActive(sim, [abra], [CardType.PSYCHIC]);
    const benched = new TestPokemon();
    player.bench[0].pokemons.cards = [benched];
    const deckSize = player.deck.cards.length;

    sim.dispatch(new UseAbilityAction(1, 'Teleporter', TestUtils.target(sim, player.active)));
    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    expect(prompt instanceof ChoosePokemonPrompt).toBeTrue();
    sim.dispatch(new ResolvePromptAction(prompt.id, [player.bench[0]]));

    expect(player.deck.cards.length).toEqual(deckSize + 2);
    expect(player.deck.cards).toContain(abra);
    expect(player.active.getPokemonCard()).toBe(benched);
  });

  it('Teleporter works only from the Active Spot, and not with an empty Bench', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0].pokemons.cards = [new AbraTWM()];
    expect(() => sim.dispatch(new UseAbilityAction(1, 'Teleporter', TestUtils.target(sim, player.bench[0]))))
      .toThrow();
    TestUtils.setActive(sim, [new AbraTWM()], []);
    player.bench[0].pokemons.cards = [];
    expect(() => sim.dispatch(new UseAbilityAction(1, 'Teleporter', TestUtils.target(sim, player.active))))
      .toThrow();
  });
});

describe('Enhanced Hammer TWM', () => {
  it('discards a Special Energy from an opponent\'s Pokémon', () => {
    const sim = TestUtils.createTestSimulator();
    const { player, opponent } = TestUtils.getAll(sim);
    const special = new TestEnergy(CardType.COLORLESS);
    special.energyType = EnergyType.SPECIAL;
    opponent.active.energies.cards = [special];
    player.hand.cards = [new EnhancedHammerTWM()];
    expect(new EnhancedHammerTWM().fullName).toEqual('Enhanced Hammer TWM');

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    let prompt = TestUtils.lastPrompt(sim, player)!;
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.active]));
    prompt = TestUtils.lastPrompt(sim, player)!;
    sim.dispatch(new ResolvePromptAction(prompt.id, [special]));
    expect(opponent.active.energies.cards.length).toEqual(0);
    expect(opponent.discard.cards).toContain(special);
  });
});
