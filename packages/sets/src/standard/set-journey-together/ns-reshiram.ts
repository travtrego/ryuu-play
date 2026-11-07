import {
  AttackEffect,
  CardType,
  Effect,
  PokemonCard,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

export class NsReshiram extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.DRAGON];

  public hp: number = 130;

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Powerful Rage',
      cost: [CardType.FIRE, CardType.LIGHTNING],
      damage: '20×',
      text: 'This attack does 20 damage for each damage counter on this Pokémon.',
    },
    {
      name: 'Virtuous Flame',
      cost: [CardType.FIRE, CardType.FIRE, CardType.LIGHTNING, CardType.COLORLESS],
      damage: '170',
      text: '',
    },
  ];

  public set: string = 'JTG';

  public name: string = 'N\'s Reshiram';

  public fullName: string = 'N\'s Reshiram JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // "This Pokémon" is the attacker: N's Zoroark ex's Night Joker can use this attack.
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      effect.damage = 20 * Math.floor(effect.player.active.damage / 10);
    }
    return state;
  }
}
