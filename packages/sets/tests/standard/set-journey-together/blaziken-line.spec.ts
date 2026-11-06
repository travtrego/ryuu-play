import {
  AttachEnergyPrompt,
  AttackAction,
  CardTag,
  CardType,
  PassTurnAction,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
  Stage,
  UseAbilityAction,
} from '@ptcg/common';

import { BlazikenEx } from '../../../src/standard/set-journey-together/blaziken-ex';
import { CombuskenDRI } from '../../../src/standard/set-destined-rivals/combusken';
import { TorchicDRI } from '../../../src/standard/set-destined-rivals/torchic';
import { ChiYu } from '../../../src/standard/set-twilight-masquerade/chi-yu';
import { TeamRocketsWatchtower } from '../../../src/standard/set-destined-rivals/team-rockets-watchtower';
import { TestUtils } from '../../test-utils';

describe('Torchic / Combusken DRI, Blaziken ex JTG, Chi-Yu TWM', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  it('Should have the printed stats', () => {
    const torchic = new TorchicDRI();
    const combusken = new CombuskenDRI();
    const blaziken = new BlazikenEx();
    const chiYu = new ChiYu();
    expect([torchic.hp, torchic.retreat.length]).toEqual([70, 1]);
    expect([combusken.hp, combusken.evolvesFrom, combusken.retreat.length]).toEqual([100, 'Torchic', 2]);
    expect([blaziken.hp, blaziken.stage, blaziken.evolvesFrom, blaziken.retreat.length])
      .toEqual([320, Stage.STAGE_2, 'Combusken', 2]);
    expect(blaziken.tags).toContain(CardTag.POKEMON_EX);
    expect([chiYu.hp, chiYu.retreat.length]).toEqual([110, 1]);
    [torchic, combusken, blaziken, chiYu].forEach(c => expect(c.weakness).toEqual([{ type: CardType.WATER }]));
  });

  it('Torchic Collect draws a card', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TorchicDRI()], [CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Collect'));
    expect(player.hand.cards.length).toEqual(1);
  });

  it('Combusken Double Kick: 40 for each heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TorchicDRI(), new CombuskenDRI()], [CardType.FIRE, CardType.COLORLESS]);
    TestUtils.setFlipResults(sim, [true, false]);
    sim.dispatch(new AttackAction(1, 'Double Kick'));
    expect(opponent.active.damage).toEqual(40);
  });

  it('Seething Spirit attaches a Basic Energy from the discard pile, once per turn', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0].pokemons.cards = [new TorchicDRI(), new CombuskenDRI(), new BlazikenEx()];
    const energies = TestUtils.makeEnergies([CardType.FIRE, CardType.FIRE]);
    player.discard.cards = [...energies];
    sim.dispatch(new UseAbilityAction(1, 'Seething Spirit', TestUtils.target(sim, player.bench[0])));
    const prompt = TestUtils.lastPrompt(sim, player) as AttachEnergyPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [
      { to: { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 }, card: energies[0] }
    ]));
    expect(player.active.energies.cards).toEqual([energies[0]]);
    expect(() => sim.dispatch(
      new UseAbilityAction(1, 'Seething Spirit', TestUtils.target(sim, player.bench[0])))).toThrow();
  });

  it('Smolder-sault does 200, then Blaziken ex can\'t attack during your next turn', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TorchicDRI(), new CombuskenDRI(), new BlazikenEx()],
      [CardType.FIRE, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Smolder-sault'));
    expect(opponent.active.damage).toEqual(200);
    sim.dispatch(new PassTurnAction(2));
    expect(() => sim.dispatch(new AttackAction(1, 'Smolder-sault'))).toThrow();
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new PassTurnAction(2));
    // A rejected action restores the state from a copy, so read it again.
    const again = TestUtils.getAll(sim).opponent;
    again.active.damage = 0;
    sim.dispatch(new AttackAction(1, 'Smolder-sault'));
    expect(again.active.damage).toEqual(200);
  });

  it('Chi-Yu Ground Melter: 120 and discards the Stadium in play, 60 without one', () => {
    const { opponent } = TestUtils.getAll(sim);
    const stadium = new TeamRocketsWatchtower();
    opponent.stadium.cards = [stadium];
    TestUtils.setActive(sim, [new ChiYu()], [CardType.FIRE, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Ground Melter'));
    expect(opponent.active.damage).toEqual(120);
    expect(opponent.stadium.cards).toEqual([]);
    expect(opponent.discard.cards).toContain(stadium);
  });

  it('Chi-Yu Allure draws 2', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new ChiYu()], [CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Allure'));
    expect(player.hand.cards.length).toEqual(2);
  });
});
