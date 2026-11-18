import {
  AttackEffect,
  CardType,
  Effect,
  PokemonCard,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';
import { isCynthiasPokemon } from './cynthia-utils';

export class CynthiasSpiritomb extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.DARK];

  public hp: number = 70;

  public weakness = [{ type: CardType.GRASS }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Raging Curse',
      cost: [CardType.COLORLESS],
      damage: '10x',
      text: 'This attack does 10 damage for each damage counter on all of your Benched Cynthia\'s Pokémon. ' +
        'This attack\'s damage isn\'t affected by Weakness.',
    },
  ];

  public set: string = 'DRI';

  public name: string = 'Cynthia\'s Spiritomb';

  public fullName: string = 'Cynthia\'s Spiritomb DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const counters = effect.player.bench
        .filter(slot => isCynthiasPokemon(slot.getPokemonCard()))
        .reduce((sum, slot) => sum + Math.floor(slot.damage / 10), 0);
      effect.damage = 10 * counters;
      effect.ignoreWeakness = true;
    }
    return state;
  }
}
