import {
  AttackAction,
  CardType,
  ChoosePokemonPrompt,
  ResolvePromptAction,
  SelectPrompt,
  Simulator,
  SpecialCondition,
  UseAbilityAction,
} from '@ptcg/common';

import { Munkidori } from '../../../src/standard/set-twilight-masquerade/munkidori';
import { TestUtils } from '../../test-utils';

describe('Munkidori TWM', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  it('Mind Bend does 60 and Confuses', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Munkidori()], [CardType.PSYCHIC, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Mind Bend'));
    expect(opponent.active.damage).toEqual(60);
    expect(opponent.active.specialConditions).toContain(SpecialCondition.CONFUSED);
  });

  it('Adrena-Brain needs D Energy attached', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Munkidori()], [CardType.PSYCHIC]);
    player.active.damage = 30;
    expect(() => sim.dispatch(new UseAbilityAction(1, 'Adrena-Brain', TestUtils.target(sim, player.active))))
      .toThrow();
  });

  it('Adrena-Brain moves up to 3 damage counters to an opponent\'s Pokémon, once per turn', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Munkidori()], [CardType.DARK]);
    player.bench[0].pokemons.cards = [new Munkidori()];
    player.bench[0].damage = 50;

    sim.dispatch(new UseAbilityAction(1, 'Adrena-Brain', TestUtils.target(sim, player.active)));
    let prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    expect(prompt instanceof ChoosePokemonPrompt).toBeTrue();
    sim.dispatch(new ResolvePromptAction(prompt.id, [player.bench[0]]));
    prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.active]));
    const select = TestUtils.lastPrompt(sim, player) as SelectPrompt;
    expect(select instanceof SelectPrompt).toBeTrue();
    expect(select.values).toEqual(['3', '2', '1']);
    sim.dispatch(new ResolvePromptAction(select.id, 0));

    expect(player.bench[0].damage).toEqual(20);
    expect(opponent.active.damage).toEqual(30);
    expect(() => sim.dispatch(new UseAbilityAction(1, 'Adrena-Brain', TestUtils.target(sim, player.active))))
      .toThrow();
  });

  it('Adrena-Brain can move fewer counters', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Munkidori()], [CardType.DARK]);
    player.active.damage = 30;
    sim.dispatch(new UseAbilityAction(1, 'Adrena-Brain', TestUtils.target(sim, player.active)));
    let prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [player.active]));
    prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.active]));
    const select = TestUtils.lastPrompt(sim, player) as SelectPrompt;
    sim.dispatch(new ResolvePromptAction(select.id, 2)); // '1'
    expect(player.active.damage).toEqual(20);
    expect(opponent.active.damage).toEqual(10);
  });
});
