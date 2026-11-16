import {
  AttackEffect,
  Card,
  CardType,
  ChooseCardsPrompt,
  Effect,
  GameMessage,
  PokemonCard,
  ShowCardsPrompt,
  ShuffleDeckPrompt,
  Stage,
  State,
  StateUtils,
  StoreLike,
  SuperType,
  TrainerType,
} from '@ptcg/common';
import { commonAttacks } from '../../common';

function* useDeceit(next: Function, store: StoreLike, state: State, effect: AttackEffect): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);

  if (player.deck.cards.length === 0) {
    return state;
  }

  let cards: Card[] = [];
  yield store.prompt(
    state,
    new ChooseCardsPrompt(
      player.id,
      GameMessage.CHOOSE_CARD_TO_HAND,
      player.deck,
      { superType: SuperType.TRAINER, trainerType: TrainerType.SUPPORTER },
      { min: 0, max: 1, allowCancel: true }
    ),
    selected => {
      cards = selected || [];
      next();
    }
  );

  if (cards.length > 0) {
    yield store.prompt(
      state,
      new ShowCardsPrompt(opponent.id, GameMessage.CARDS_SHOWED_BY_THE_OPPONENT, cards),
      () => next()
    );
  }

  player.deck.moveCardsTo(cards, player.hand);

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

export class TeamRocketsMurkrow extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.DARK];

  public hp: number = 80;

  public weakness = [{ type: CardType.LIGHTNING }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Deceit',
      cost: [CardType.COLORLESS],
      damage: '',
      text: 'Search your deck for a Supporter card, reveal it, and put it into your hand. Then, shuffle your deck.',
    },
    {
      name: 'Torment',
      cost: [CardType.DARK, CardType.COLORLESS],
      damage: '30',
      text: 'Choose 1 of your opponent\'s Active Pokémon\'s attacks. That Pokémon can\'t use that attack during ' +
        'your opponent\'s next turn.',
    },
  ];

  public set: string = 'DRI';

  public name: string = 'Team Rocket\'s Murkrow';

  public fullName: string = 'Team Rocket\'s Murkrow DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    const torment = commonAttacks.amnesia(this, store, state, effect);

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const generator = useDeceit(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      return torment.use(effect);
    }

    return state;
  }
}

