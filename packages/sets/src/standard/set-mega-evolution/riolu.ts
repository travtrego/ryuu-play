import {
  AttackEffect,
  CardType,
  Effect,
  GameError,
  GameMessage,
  PokemonCard,
  Stage,
  State,
  StoreLike,
  UseAttackEffect,
} from '@ptcg/common';
import { commonMarkers } from '../../common';

export class RioluMEG extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.FIGHTING];

  public hp: number = 80;

  public weakness = [{ type: CardType.PSYCHIC }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Accelerating Stab',
      cost: [CardType.FIGHTING],
      damage: '30',
      text: 'During your next turn, this Pokémon can\'t use Accelerating Stab.',
    },
  ];

  public set: string = 'MEG';

  public name: string = 'Riolu';

  public fullName: string = 'Riolu MEG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    const yourNextTurn = commonMarkers.duringYourNextTurn(this, store, state, effect);

    if (effect instanceof UseAttackEffect && effect.attack === this.attacks[0] && yourNextTurn.hasMarker(effect)) {
      throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      yourNextTurn.setMarker(effect);
    }

    return state;
  }
}
