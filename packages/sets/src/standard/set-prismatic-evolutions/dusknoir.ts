import {
  AttackEffect,
  CardType,
  Effect,
  GameError,
  GameMessage,
  PokemonCard,
  PowerEffect,
  PowerType,
  RetreatEffect,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';
import { commonMarkers } from '../../common';
import { useCursedBlast } from './cursed-blast';

export class Dusknoir extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;

  public evolvesFrom = 'Dusclops';

  public cardTypes: CardType[] = [CardType.PSYCHIC];

  public hp: number = 160;

  public weakness = [{ type: CardType.DARK }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS];

  public powers = [
    {
      name: 'Cursed Blast',
      useWhenInPlay: true,
      powerType: PowerType.ABILITY,
      text: 'Once during your turn, you may put 13 damage counters on 1 of your opponent\'s Pokémon. ' +
        'If you use this Ability, this Pokémon is Knocked Out.',
    },
  ];

  public attacks = [
    {
      name: 'Shadow Bind',
      cost: [CardType.PSYCHIC, CardType.PSYCHIC, CardType.COLORLESS],
      damage: '150',
      text: 'During your opponent\'s next turn, the Defending Pokémon can\'t retreat.',
    },
  ];

  public set: string = 'PRE';

  public name: string = 'Dusknoir';

  public fullName: string = 'Dusknoir PRE';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    const opponentNextTurn = commonMarkers.duringOpponentNextTurn(this, store, state, effect);

    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      return useCursedBlast(store, state, effect, this, 13);
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      opponentNextTurn.setMarker(effect, effect.opponent.active);
      return state;
    }

    if (effect instanceof RetreatEffect && opponentNextTurn.hasMarker(effect, effect.player.active)) {
      throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
    }

    return state;
  }
}
