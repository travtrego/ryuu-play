import {
  AttackEffect,
  CardType,
  Effect,
  PlayerType,
  PokemonCard,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

export class Passimian extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.FIGHTING];

  public hp: number = 110;

  public weakness = [{ type: CardType.PSYCHIC }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Coordinated Throwing',
      cost: [CardType.FIGHTING, CardType.COLORLESS],
      damage: '20×',
      text: 'This attack does 20 damage for each of your Basic Pokémon in play.',
    },
  ];

  public set: string = 'SSP';

  public name: string = 'Passimian';

  public fullName: string = 'Passimian SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      let basics = 0;
      effect.player.forEachPokemon(PlayerType.BOTTOM_PLAYER, slot => {
        if (slot.isBasic()) {
          basics += 1;
        }
      });
      effect.damage = 20 * basics;
    }
    return state;
  }
}
