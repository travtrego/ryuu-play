import {
  AttackEffect,
  CardType,
  Effect,
  PokemonCard,
  Stage,
  State,
  StoreLike,
  TrainerCard,
} from '@ptcg/common';
import { isTeamRocketSupporter } from './team-rocket-utils';

export class TeamRocketsPorygon2 extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom: string = 'Team Rocket\'s Porygon';

  public cardTypes: CardType[] = [CardType.COLORLESS];

  public hp: number = 90;

  public weakness = [{ type: CardType.FIGHTING }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'R Command',
      cost: [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
      damage: '20×',
      text: 'This attack does 20 damage for each Supporter card that has "Team Rocket" in its name in your ' +
        'discard pile.',
    },
  ];

  public set: string = 'DRI';

  public name: string = 'Team Rocket\'s Porygon2';

  public fullName: string = 'Team Rocket\'s Porygon2 DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const count = effect.player.discard.cards
        .filter(card => card instanceof TrainerCard && isTeamRocketSupporter(card))
        .length;
      effect.damage = 20 * count;
    }

    return state;
  }
}
