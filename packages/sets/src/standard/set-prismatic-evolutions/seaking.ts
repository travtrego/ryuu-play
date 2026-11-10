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
import { applyFestivalLead, festivalLeadPower } from '../set-twilight-masquerade/festival-lead';

export class SeakingPRE extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom: string = 'Goldeen';

  public cardTypes: CardType[] = [CardType.WATER];

  public hp: number = 110;

  public weakness = [{ type: CardType.LIGHTNING }];

  public retreat = [CardType.COLORLESS];

  public powers = [festivalLeadPower()];

  public attacks = [
    { name: 'Rapid Draw', cost: [CardType.COLORLESS], damage: '60', text: 'Draw 2 cards.' },
  ];

  public set: string = 'PRE';

  public name: string = 'Seaking';

  public fullName: string = 'Seaking PRE';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof CheckAttackCountEffect) {
      applyFestivalLead(store, state, effect, this, this.powers[0]);
      return state;
    }

    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      return state;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      effect.player.deck.moveTo(effect.player.hand, 2);
    }

    return state;
  }
}
