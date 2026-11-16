import {
  AttackEffect,
  CardType,
  ChooseCardsPrompt,
  Effect,
  GameMessage,
  PokemonCard,
  Stage,
  State,
  StoreLike,
  TrainerCard,
} from '@ptcg/common';
import { isTeamRocketSupporter } from '../set-destined-rivals/team-rocket-utils';

export class TeamRocketsHonchkrow extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom: string = 'Team Rocket\'s Murkrow';

  public cardTypes: CardType[] = [CardType.DARK];

  public hp: number = 130;

  public weakness = [{ type: CardType.LIGHTNING }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Rocket Feathers',
      cost: [CardType.COLORLESS, CardType.COLORLESS],
      damage: '60×',
      text: 'Discard any number of Supporter cards that have "Team Rocket" in their name from your hand, and ' +
        'this attack does 60 damage for each card you discarded in this way.',
    },
    {
      name: 'Hammer In',
      cost: [CardType.DARK, CardType.COLORLESS, CardType.COLORLESS],
      damage: '100',
      text: '',
    },
  ];

  public set: string = 'ASC';

  public name: string = 'Team Rocket\'s Honchkrow';

  public fullName: string = 'Team Rocket\'s Honchkrow ASC';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      const blocked: number[] = [];
      player.hand.cards.forEach((card, index) => {
        if (!(card instanceof TrainerCard && isTeamRocketSupporter(card))) {
          blocked.push(index);
        }
      });
      const available = player.hand.cards.length - blocked.length;

      effect.damage = 0;
      if (available === 0) {
        return state;
      }

      return store.prompt(
        state,
        new ChooseCardsPrompt(player.id, GameMessage.CHOOSE_CARD_TO_DISCARD, player.hand, {}, {
          min: 0,
          max: available,
          allowCancel: true,
          blocked,
        }),
        selected => {
          const cards = selected || [];
          player.hand.moveCardsTo(cards, player.discard);
          effect.damage = 60 * cards.length;
        }
      );
    }

    return state;
  }
}
