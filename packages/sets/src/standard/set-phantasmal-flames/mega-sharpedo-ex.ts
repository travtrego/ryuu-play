import {
  AttackEffect,
  CardTag,
  CardType,
  Effect,
  PokemonCard,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

export class MegaSharpedoEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX, CardTag.MEGA_EVOLUTION_EX];

  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom: string = 'Carvanha';

  public cardTypes: CardType[] = [CardType.DARK];

  public hp: number = 330;

  public weakness = [{ type: CardType.GRASS }];

  public retreat = [];

  public attacks = [
    {
      name: 'Greedy Fang',
      cost: [CardType.DARK],
      damage: '70',
      text: 'Draw 2 cards.',
    },
    {
      name: 'Hungry Jaws',
      cost: [CardType.DARK, CardType.DARK],
      damage: '120+',
      text: 'If this Pokémon has any damage counters on it, this attack does 150 more damage.',
    },
  ];

  public set: string = 'PFL';

  public name: string = 'Mega Sharpedo ex';

  public fullName: string = 'Mega Sharpedo ex PFL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      effect.player.deck.moveTo(effect.player.hand, 2);
      return state;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      if (effect.player.active.damage > 0) {
        effect.damage += 150;
      }
    }

    return state;
  }
}
