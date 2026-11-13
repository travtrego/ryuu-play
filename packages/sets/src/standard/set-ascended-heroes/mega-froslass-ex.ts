import {
  AddSpecialConditionsEffect,
  AttackEffect,
  CardTag,
  CardType,
  Effect,
  PokemonCard,
  SpecialCondition,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

export class MegaFroslassEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX, CardTag.MEGA_EVOLUTION_EX];

  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom: string = 'Snorunt';

  public cardTypes: CardType[] = [CardType.WATER];

  public hp: number = 310;

  public weakness = [{ type: CardType.METAL }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Resentful Refrain',
      cost: [CardType.WATER],
      damage: '50×',
      text: 'This attack does 50 damage for each card in your opponent\'s hand.',
    },
    {
      name: 'Absolute Snow',
      cost: [CardType.WATER, CardType.COLORLESS, CardType.COLORLESS],
      damage: '150',
      text: 'Your opponent\'s Active Pokémon is now Asleep.',
    },
  ];

  public set: string = 'ASC';

  public name: string = 'Mega Froslass ex';

  public fullName: string = 'Mega Froslass ex ASC';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      effect.damage = 50 * effect.opponent.hand.cards.length;
      return state;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      store.reduceEffect(state, new AddSpecialConditionsEffect(effect, [SpecialCondition.ASLEEP]));
    }

    return state;
  }
}
