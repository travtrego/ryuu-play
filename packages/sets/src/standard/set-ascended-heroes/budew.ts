import {
  AttachPokemonToolEffect,
  AttackEffect,
  CardType,
  Effect,
  EndTurnEffect,
  GameError,
  GameMessage,
  PlayItemEffect,
  PokemonCard,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

export class Budew extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.GRASS];

  public hp: number = 30;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [];

  public attacks = [
    {
      name: 'Itchy Pollen',
      cost: [],
      damage: '10',
      text: 'During your opponent\'s next turn, they can\'t play any Item cards from their hand.',
    },
  ];

  public set: string = 'ASC';

  public name: string = 'Budew';

  public fullName: string = 'Budew ASC';

  public readonly ITCHY_POLLEN_MARKER = 'ITCHY_POLLEN_MARKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const opponent = StateUtils.getOpponent(state, effect.player);
      opponent.marker.addMarker(this.ITCHY_POLLEN_MARKER, this);
      return state;
    }

    // Pokémon Tools are Item cards too.
    if ((effect instanceof PlayItemEffect || effect instanceof AttachPokemonToolEffect)
      && effect.player.marker.hasMarker(this.ITCHY_POLLEN_MARKER, this)) {
      throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
    }

    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(this.ITCHY_POLLEN_MARKER, this);
    }

    return state;
  }
}
