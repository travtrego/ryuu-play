import {
  AttackEffect,
  Card,
  CardType,
  ChooseCardsPrompt,
  Effect,
  GameMessage,
  PokemonCard,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

function* useHacking(next: Function, store: StoreLike, state: State, effect: AttackEffect): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);

  if (player.hand.cards.length === 0) {
    return state;
  }

  let cards: Card[] = [];
  yield store.prompt(
    state,
    new ChooseCardsPrompt(player.id, GameMessage.CHOOSE_CARD_TO_DISCARD, player.hand, {}, {
      min: 1,
      max: 1,
      allowCancel: false,
    }),
    selected => {
      cards = selected || [];
      next();
    }
  );

  if (cards.length === 0) {
    return state;
  }
  player.hand.moveCardsTo(cards, player.discard);

  if (opponent.hand.cards.length === 0) {
    return state;
  }

  return store.prompt(
    state,
    new ChooseCardsPrompt(opponent.id, GameMessage.CHOOSE_CARD_TO_DISCARD, opponent.hand, {}, {
      min: 1,
      max: 1,
      allowCancel: false,
    }),
    selected => {
      opponent.hand.moveCardsTo(selected || [], opponent.discard);
    }
  );
}

export class TeamRocketsPorygon extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.COLORLESS];

  public hp: number = 60;

  public weakness = [{ type: CardType.FIGHTING }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Hacking',
      cost: [CardType.COLORLESS],
      damage: '',
      text: 'Discard a card from your hand. If you do, your opponent discards a card from their hand.',
    },
  ];

  public set: string = 'DRI';

  public name: string = 'Team Rocket\'s Porygon';

  public fullName: string = 'Team Rocket\'s Porygon DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const generator = useHacking(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    return state;
  }
}
