import {
  Card,
  CardList,
  CardType,
  ChooseCardsPrompt,
  Effect,
  EndTurnEffect,
  GameError,
  GameMessage,
  PokemonCard,
  PowerEffect,
  PowerType,
  ShowCardsPrompt,
  ShuffleDeckPrompt,
  Stage,
  State,
  StateUtils,
  StoreLike,
  SuperType,
  TrainerType,
} from '@ptcg/common';

function* useAttractCustomers(
  next: Function,
  store: StoreLike,
  state: State,
  effect: PowerEffect,
  self: Tatsugiri
): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);
  player.marker.addMarker(self.ATTRACT_CUSTOMERS_MARKER, self);

  const top = new CardList();
  player.deck.moveTo(top, 6);

  let found: Card[] = [];
  yield store.prompt(state, new ChooseCardsPrompt(
    player.id,
    GameMessage.CHOOSE_CARD_TO_HAND,
    top,
    { superType: SuperType.TRAINER, trainerType: TrainerType.SUPPORTER },
    { min: 0, max: 1, allowCancel: false }
  ), selected => {
    found = selected || [];
    next();
  });

  top.moveCardsTo(found, player.hand);
  top.moveTo(player.deck);

  if (found.length > 0) {
    yield store.prompt(state, new ShowCardsPrompt(opponent.id, GameMessage.CARDS_SHOWED_BY_THE_OPPONENT, found),
      () => next());
  }

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

export class Tatsugiri extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.DRAGON];

  public hp: number = 70;

  public retreat = [CardType.COLORLESS];

  public powers = [
    {
      name: 'Attract Customers',
      useWhenInPlay: true,
      powerType: PowerType.ABILITY,
      text: 'Once during your turn, if this Pokémon is in the Active Spot, you may look at the top 6 cards ' +
        'of your deck, reveal a Supporter card you find there, and put it into your hand. Shuffle the other ' +
        'cards back into your deck.',
    },
  ];

  public attacks = [
    {
      name: 'Surf',
      cost: [CardType.FIRE, CardType.WATER],
      damage: '50',
      text: '',
    },
  ];

  public set: string = 'TWM';

  public name: string = 'Tatsugiri';

  public fullName: string = 'Tatsugiri TWM';

  public readonly ATTRACT_CUSTOMERS_MARKER = 'ATTRACT_CUSTOMERS_MARKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;
      if (player.active.getPokemonCard() !== this || player.deck.cards.length === 0) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      if (player.marker.hasMarker(this.ATTRACT_CUSTOMERS_MARKER, this)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }
      const generator = useAttractCustomers(() => generator.next(), store, state, effect, this);
      return generator.next().value;
    }

    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(this.ATTRACT_CUSTOMERS_MARKER, this);
    }

    return state;
  }
}
