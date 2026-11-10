import {
  AttackEffect,
  CardType,
  CheckAttackCountEffect,
  Effect,
  PokemonCard,
  PowerEffect,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';
import { applyFestivalLead, festivalLeadPower } from './festival-lead';

export class Dipplin extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom: string = 'Applin';

  public cardTypes: CardType[] = [CardType.GRASS];

  public hp: number = 80;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public powers = [festivalLeadPower()];

  public attacks = [
    {
      name: 'Do the Wave',
      cost: [CardType.GRASS],
      damage: '20×',
      text: 'This attack does 20 damage for each of your Benched Pokémon.',
    },
  ];

  public set: string = 'TWM';

  public name: string = 'Dipplin';

  public fullName: string = 'Dipplin TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof CheckAttackCountEffect) {
      applyFestivalLead(store, state, effect, this, this.powers[0]);
      return state;
    }

    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      // A passive Ability: only checked, never used.
      return state;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const benched = effect.player.bench.filter(b => b.pokemons.cards.length > 0).length;
      effect.damage = 20 * benched;
    }

    return state;
  }
}
