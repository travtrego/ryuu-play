import {
  Effect,
  GameError,
  GameMessage,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerType,
  UseStadiumEffect,
} from '@ptcg/common';
import { isTeamRocketSupporter } from './team-rocket-utils';

export class TeamRocketsFactory extends TrainerCard {
  public trainerType: TrainerType = TrainerType.STADIUM;

  public set: string = 'DRI';

  public name: string = 'Team Rocket\'s Factory';

  public fullName: string = 'Team Rocket\'s Factory DRI';

  public text: string =
    'Once during each player\'s turn, if they played a Supporter card that has "Team Rocket" in its name ' +
    'from their hand this turn, they may draw 2 cards.';

  public useWhenInPlay = true;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof UseStadiumEffect && StateUtils.getStadiumCard(state) === this) {
      const player = effect.player;
      const playedTeamRocketSupporter = player.supporter.cards.some(card =>
        card instanceof TrainerCard && isTeamRocketSupporter(card)
      );

      if (!playedTeamRocketSupporter || player.deck.cards.length === 0) {
        throw new GameError(GameMessage.CANNOT_USE_STADIUM);
      }

      player.deck.moveTo(player.hand, 2);
    }

    return state;
  }
}
