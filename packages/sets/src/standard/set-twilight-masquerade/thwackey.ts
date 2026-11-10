import {
  Card,
  CardType,
  ChooseCardsPrompt,
  Effect,
  EndTurnEffect,
  GameError,
  GameMessage,
  PokemonCard,
  PowerEffect,
  PowerType,
  ShuffleDeckPrompt,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';
import { FESTIVAL_LEAD_NAME } from './festival-lead';

function* searchDeck(next: Function, store: StoreLike, state: State, effect: PowerEffect): IterableIterator<State> {
  const player = effect.player;
  let cards: Card[] = [];
  yield store.prompt(state, new ChooseCardsPrompt(
    player.id,
    GameMessage.CHOOSE_CARD_TO_HAND,
    player.deck,
    {},
    { min: 1, max: 1, allowCancel: false }
  ), selected => {
    cards = selected || [];
    next();
  });

  player.deck.moveCardsTo(cards, player.hand);

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

export class Thwackey extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom: string = 'Grookey';

  public cardTypes: CardType[] = [CardType.GRASS];

  public hp: number = 100;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public powers = [
    {
      name: 'Boom Boom Groove',
      useWhenInPlay: true,
      powerType: PowerType.ABILITY,
      text: 'Once during your turn, if your Active Pokémon has the Festival Lead Ability, you may search your ' +
        'deck for a card and put it into your hand. Then, shuffle your deck.',
    },
  ];

  public attacks = [
    { name: 'Beat', cost: [CardType.GRASS, CardType.GRASS], damage: '50', text: '' },
  ];

  public set: string = 'TWM';

  public name: string = 'Thwackey';

  public fullName: string = 'Thwackey TWM';

  public readonly BOOM_BOOM_GROOVE_MARKER = 'BOOM_BOOM_GROOVE_MARKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;
      if (player.marker.hasMarker(this.BOOM_BOOM_GROOVE_MARKER, this)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }
      const active = player.active.getPokemonCard();
      const hasFestivalLead = active !== undefined && active.powers.some(p => p.name === FESTIVAL_LEAD_NAME);
      if (!hasFestivalLead || player.deck.cards.length === 0) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }

      player.marker.addMarker(this.BOOM_BOOM_GROOVE_MARKER, this);
      const generator = searchDeck(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(this.BOOM_BOOM_GROOVE_MARKER, this);
    }

    return state;
  }
}
