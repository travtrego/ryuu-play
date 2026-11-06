import {
  AttackEffect,
  CardType,
  Effect,
  PokemonCard,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

export class TeamRocketsTarountula extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.GRASS];

  public hp: number = 50;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Take Down',
      cost: [CardType.GRASS],
      damage: '30',
      text: 'This Pokémon also does 10 damage to itself.',
    },
  ];

  public set: string = 'DRI';

  public name: string = 'Team Rocket\'s Tarountula';

  public fullName: string = 'Team Rocket\'s Tarountula DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      effect.player.active.damage += 10;
    }

    return state;
  }
}
