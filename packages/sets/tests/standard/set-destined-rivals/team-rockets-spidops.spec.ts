import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  ResolvePromptAction,
  Simulator,
  UseAbilityAction,
} from '@ptcg/common';

import { TeamRocketsSpidops } from '../../../src/standard/set-destined-rivals/team-rockets-spidops';
import { TeamRocketsTarountula } from '../../../src/standard/set-destined-rivals/team-rockets-tarountula';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Team Rocket\'s Spidops DRI', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  it('Should have the printed stats', () => {
    const card = new TeamRocketsSpidops();
    expect(card.hp).toEqual(130);
    expect(card.evolvesFrom).toEqual('Team Rocket\'s Tarountula');
    expect(card.weakness).toEqual([{ type: CardType.FIRE }]);
    expect(card.retreat.length).toEqual(2);
    expect(card.powers[0].name).toEqual('Charging Up');
  });

  it('Rocket Rush does 30 for each Team Rocket\'s Pokémon in play', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TeamRocketsTarountula(), new TeamRocketsSpidops()],
      [CardType.GRASS, CardType.COLORLESS]);
    player.bench[0].pokemons.cards = [new TeamRocketsTarountula()];
    player.bench[1].pokemons.cards = [new TeamRocketsTarountula()];
    player.bench[2].pokemons.cards = [new TestPokemon()];
    sim.dispatch(new AttackAction(1, 'Rocket Rush'));
    expect(opponent.active.damage).toEqual(90);
  });

  it('Charging Up attaches a Basic Energy from the discard pile, once per turn', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0].pokemons.cards = [new TeamRocketsTarountula(), new TeamRocketsSpidops()];
    player.discard.cards = TestUtils.makeEnergies([CardType.GRASS, CardType.GRASS]);

    sim.dispatch(new UseAbilityAction(1, 'Charging Up', TestUtils.target(sim, player.bench[0])));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt instanceof ChooseCardsPrompt).toBeTrue();
    sim.dispatch(new ResolvePromptAction(prompt.id, [player.discard.cards[0]]));

    expect(player.bench[0].energies.cards.length).toEqual(1);
    expect(player.discard.cards.length).toEqual(1);
    expect(() => sim.dispatch(
      new UseAbilityAction(1, 'Charging Up', TestUtils.target(sim, player.bench[0])))).toThrow();
  });
});
