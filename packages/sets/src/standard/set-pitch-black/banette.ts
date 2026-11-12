import {
  AttackEffect,
  Card,
  CardType,
  ChooseCardsPrompt,
  Effect,
  GameMessage,
  PokemonCard,
  ShuffleDeckPrompt,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';
import { HideNSneak } from './hide-n-sneak';

function* usePuppetPull(next: Function, store: StoreLike, state: State, effect: AttackEffect): IterableIterator<State> {
  const player = effect.player;
  if (player.deck.cards.length === 0) {
    return state;
  }

  let cards: Card[] = [];
  yield store.prompt(state, new ChooseCardsPrompt(
    player.id,
    GameMessage.CHOOSE_CARD_TO_HAND,
    player.deck,
    {},
    { min: 0, max: 1, allowCancel: true }
  ), selected => {
    cards = selected || [];
    next();
  });

  player.deck.moveCardsTo(cards, player.hand);

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

export class Banette extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom: string = 'Shuppet';

  public cardTypes: CardType[] = [CardType.PSYCHIC];

  public hp: number = 80;

  public weakness = [{ type: CardType.DARK }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [CardType.COLORLESS];

  public powers = [HideNSneak.power()];

  public attacks = [
    {
      name: 'Puppet Pull',
      cost: [CardType.PSYCHIC],
      damage: '80',
      text: 'You may search your deck for a card and put it into your hand. Then, shuffle your deck.',
    },
  ];

  public set: string = 'PBL';

  public name: string = 'Banette';

  public fullName: string = 'Banette PBL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (HideNSneak.reduce(this, store, state, effect)) {
      return state;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const generator = usePuppetPull(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    return state;
  }
}
