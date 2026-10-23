import {
  AttackAction,
  CardType,
  ChooseEnergyPrompt,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { DarkRapidash } from '../../../src/base-sets/set-team-rocket/dark-rapidash';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Dark Rapidash TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new DarkRapidash()],
      [CardType.FIRE, CardType.FIRE, CardType.WATER]
    );
  });

  // Rear Kick (20)
  it('Should use Rear Kick', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Rear Kick'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  // Flame Pillar (30) - You may discard 1 R Energy card attached to Dark Rapidash when you use this attack. If you
  // do and if your opponent has any Benched Pokémon, choose 1 of them and this attack does 10 damage to it. (Don't
  // apply Weakness and Resistance for Benched Pokémon.)
  it('Should use Flame Pillar - discard a R Energy card and do 10 damage to a Benched Pokémon', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const weak = new TestPokemon();
    weak.weakness = [{ type: CardType.FIRE }];
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[1] = TestUtils.pokemonSlot([weak]);
    const [f1, f2, water] = player.active.energies.cards;

    sim.dispatch(new AttackAction(1, 'Flame Pillar'));

    const energy = prompts[0] as ChooseEnergyPrompt;
    expect(energy).toEqual(jasmine.objectContaining({ type: 'Choose energy', playerId: player.id }));
    sim.dispatch(new ResolvePromptAction(energy.id, [{ card: f1, provides: [CardType.FIRE] }]));

    const choose = prompts[1];
    expect(choose).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(choose.id, [opponent.bench[1]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.bench[1].damage).toEqual(10);
    expect(opponent.bench[0].damage).toEqual(0);
    expect(player.active.energies.cards).toEqual([f2, water]);
    expect(player.discard.cards).toEqual([f1]);
  });

  it('Should use Flame Pillar - discard without opponent\'s Benched Pokémon', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const [f1] = player.active.energies.cards;

    sim.dispatch(new AttackAction(1, 'Flame Pillar'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [{ card: f1, provides: [CardType.FIRE] }]));

    expect(prompts.some(p => p.type === 'Choose pokemon')).toBeFalse();
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(player.discard.cards).toEqual([f1]);
  });

  it('Should use Flame Pillar without discarding - no bench damage', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Flame Pillar'));

    const energy = prompts[0] as ChooseEnergyPrompt;
    expect(energy.options.allowCancel).toBeTrue();
    sim.dispatch(new ResolvePromptAction(energy.id, null));

    expect(prompts.some(p => p.type === 'Choose pokemon')).toBeFalse();
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.bench[0].damage).toEqual(0);
    expect(player.active.energies.cards.length).toEqual(3);
  });
});
