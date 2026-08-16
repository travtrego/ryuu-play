import { AttackAction, Player, PlayCardAction, PokemonCard, PokemonSlot, RetreatAction, PassTurnAction,
  UseAbilityAction, UseStadiumAction, UseTrainerInPlayAction, PlayerType, SlotType } from '@ptcg/common';
import { describeAction } from './action-describer';

function testPokemon(name: string): PokemonCard {
  class TestPokemon extends PokemonCard {
    name = name;
    fullName = name;
    set = 'test';
    hp = 100;
  }
  return new TestPokemon();
}

describe('describeAction', () => {

  let player: Player;

  beforeEach(() => {
    player = new Player();
    player.id = 1;
  });

  it('describes playing a card from hand', () => {
    player.hand.cards = [ testPokemon('Ultra Ball') ];
    const action = new PlayCardAction(player.id, 0, { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.DISCARD, index: 0 });

    expect(describeAction(player, action)).toBe('Play Ultra Ball');
  });

  it('describes an attack', () => {
    const action = new AttackAction(player.id, 'Psystrike');

    expect(describeAction(player, action)).toBe('Attack with Psystrike');
  });

  it('describes using an ability', () => {
    const target = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
    const action = new UseAbilityAction(player.id, 'Jet Boost', target);

    expect(describeAction(player, action)).toBe('Use Ability: Jet Boost');
  });

  it('describes using the stadium in play', () => {
    const action = new UseStadiumAction(player.id);

    expect(describeAction(player, action)).toBe('Use the Stadium in play');
  });

  it('describes using a trainer already in play', () => {
    const target = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
    const action = new UseTrainerInPlayAction(player.id, target, 'Bravery Charm');

    expect(describeAction(player, action)).toBe('Use Bravery Charm already in play');
  });

  it('describes retreating to a benched Pokémon', () => {
    player.bench = [ new PokemonSlot() ];
    player.bench[0].pokemons.cards = [ testPokemon('Spidops') ];
    const action = new RetreatAction(player.id, 0);

    expect(describeAction(player, action)).toBe('Retreat to Spidops');
  });

  it('describes passing the turn', () => {
    const action = new PassTurnAction(player.id);

    expect(describeAction(player, action)).toBe('Pass the turn');
  });

});
