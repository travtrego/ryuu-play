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
  ShowCardsPrompt,
  ShuffleDeckPrompt,
  Stage,
  State,
  StateUtils,
  StoreLike,
  SuperType,
} from '@ptcg/common';
import { isCynthiasPokemon } from './cynthia-utils';

function* useChampionsCall(next: Function, store: StoreLike, state: State, effect: PowerEffect): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);

  const blocked: number[] = [];
  player.deck.cards.forEach((card, index) => {
    if (!(card instanceof PokemonCard) || !isCynthiasPokemon(card)) {
      blocked.push(index);
    }
  });

  let cards: Card[] = [];
  if (blocked.length < player.deck.cards.length) {
    yield store.prompt(
      state,
      new ChooseCardsPrompt(
        player.id,
        GameMessage.CHOOSE_CARD_TO_HAND,
        player.deck,
        { superType: SuperType.POKEMON },
        { min: 0, max: 1, allowCancel: true, blocked }
      ),
      selected => {
        cards = selected || [];
        next();
      }
    );
  }

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

export class CynthiasGabite extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom = 'Cynthia\'s Gible';

  public cardTypes: CardType[] = [CardType.FIGHTING];

  public hp: number = 100;

  public weakness = [{ type: CardType.GRASS }];

  public retreat = [CardType.COLORLESS];

  public powers = [
    {
      name: 'Champion\'s Call',
      useWhenInPlay: true,
      powerType: PowerType.ABILITY,
      text: 'Once during your turn, you may search your deck for a Cynthia\'s Pokémon, reveal it, and put it ' +
        'into your hand. Then, shuffle your deck.',
    },
  ];

  public attacks = [
    { name: 'Dragonslice', cost: [CardType.FIGHTING], damage: '40', text: '' },
  ];

  public set: string = 'DRI';

  public name: string = 'Cynthia\'s Gabite';

  public fullName: string = 'Cynthia\'s Gabite DRI';

  public readonly CHAMPIONS_CALL_MARKER = 'CHAMPIONS_CALL_MARKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;
      if (StateUtils.findPokemonSlot(state, this) === undefined || player.deck.cards.length === 0) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      if (player.marker.hasMarker(this.CHAMPIONS_CALL_MARKER, this)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }
      player.marker.addMarker(this.CHAMPIONS_CALL_MARKER, this);
      const generator = useChampionsCall(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(this.CHAMPIONS_CALL_MARKER, this);
    }

    return state;
  }
}
