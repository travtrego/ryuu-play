import {
  AttackAction,
  CardTag,
  CardType,
  ChooseAttackPrompt,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { TeamRocketsMimikyu } from '../../../src/standard/set-destined-rivals/team-rockets-mimikyu';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class TeraPokemon extends TestPokemon {
  public tags = [CardTag.TERA];
  public attacks = [
    { name: 'Big Hit', cost: [CardType.FIRE, CardType.FIRE, CardType.FIRE], damage: '90', text: '' },
  ];
  public name = 'Tera Pokemon';
  public fullName = 'Tera Pokemon TEST';
}

describe('Team Rocket\'s Mimikyu DRI', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    TestUtils.setActive(sim, [new TeamRocketsMimikyu()], [CardType.PSYCHIC, CardType.COLORLESS]);
  });

  it('Should have the printed stats', () => {
    const card = new TeamRocketsMimikyu();
    expect(card.hp).toEqual(60);
    expect(card.cardTypes).toEqual([CardType.PSYCHIC]);
    expect(card.weakness).toEqual([{ type: CardType.DARK }]);
    expect(card.resistance).toEqual([{ type: CardType.FIGHTING, value: -30 }]);
    expect(card.retreat).toEqual([]);
    expect(card.attacks[0].cost).toEqual([CardType.PSYCHIC, CardType.COLORLESS]);
  });

  it('Gemstone Mimicry does nothing if the opponent\'s Active is not a Tera Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    sim.dispatch(new AttackAction(1, 'Gemstone Mimicry'));
    expect(TestUtils.lastPrompt(sim, player) instanceof ChooseAttackPrompt).toBeFalse();
    expect(opponent.active.damage).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
  });

  it('Gemstone Mimicry copies an attack of the opponent\'s Active Tera Pokémon, ignoring its cost', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const tera = new TeraPokemon();
    opponent.active.pokemons.cards = [tera];
    sim.dispatch(new AttackAction(1, 'Gemstone Mimicry'));

    const prompt = TestUtils.lastPrompt(sim, player) as ChooseAttackPrompt;
    expect(prompt instanceof ChooseAttackPrompt).toBeTrue();
    // The engine hands the card the decoded choice (the Attack itself).
    sim.dispatch(new ResolvePromptAction(prompt.id, tera.attacks[0]));

    expect(opponent.active.damage).toEqual(90);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
  });
});
