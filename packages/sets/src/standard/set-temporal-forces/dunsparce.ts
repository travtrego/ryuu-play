import {
  AbstractAttackEffect,
  AttackEffect,
  CardType,
  CoinFlipPrompt,
  Effect,
  GameMessage,
  PokemonCard,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';
import { commonMarkers } from '../../common';

export class Dunsparce extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.COLORLESS];

  public hp: number = 60;

  public weakness = [{ type: CardType.FIGHTING }];

  public retreat = [];

  public attacks = [
    { name: 'Gnaw', cost: [CardType.COLORLESS], damage: '10', text: '' },
    {
      name: 'Dig',
      cost: [CardType.COLORLESS, CardType.COLORLESS],
      damage: '30',
      text: 'Flip a coin. If heads, during your opponent\'s next turn, prevent all damage from and effects of ' +
        'attacks done to this Pokémon.',
    },
  ];

  public set: string = 'TEF';

  public name: string = 'Dunsparce';

  public fullName: string = 'Dunsparce TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    const opponentNextTurn = commonMarkers.duringOpponentNextTurn(this, store, state, effect);

    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      const player = effect.player;
      return store.prompt(state, new CoinFlipPrompt(player.id, GameMessage.COIN_FLIP), result => {
        if (result === true) {
          opponentNextTurn.setMarker(effect, player.active);
        }
      });
    }

    if (effect instanceof AbstractAttackEffect && opponentNextTurn.hasMarker(effect, effect.target)) {
      effect.preventDefault = true;
      return state;
    }

    return state;
  }
}
