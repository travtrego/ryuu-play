import {
  AttackEffect,
  Card,
  CardTag,
  CardType,
  ChooseCardsPrompt,
  ConfirmPrompt,
  Effect,
  EndTurnEffect,
  GameMessage,
  PlayPokemonEffect,
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

/** Shared by every Ability with "Last-Ditch" in its name: only 1 of them each turn. */
export const LAST_DITCH_MARKER = 'LAST_DITCH_MARKER';

function* useLastDitchCatch(
  next: Function,
  store: StoreLike,
  state: State,
  effect: PlayPokemonEffect,
  self: MeowthEx
): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);

  let wantToUse = false;
  yield store.prompt(state, new ConfirmPrompt(player.id, GameMessage.WANT_TO_USE_ABILITY), result => {
    wantToUse = result;
    next();
  });
  if (!wantToUse) {
    return state;
  }

  player.marker.addMarker(LAST_DITCH_MARKER, self);

  let cards: Card[] = [];
  yield store.prompt(state, new ChooseCardsPrompt(
    player.id,
    GameMessage.CHOOSE_CARD_TO_HAND,
    player.deck,
    { superType: SuperType.TRAINER, trainerType: TrainerType.SUPPORTER },
    { min: 0, max: 1, allowCancel: true }
  ), selected => {
    cards = selected || [];
    next();
  });

  player.deck.moveCardsTo(cards, player.hand);
  if (cards.length > 0) {
    yield store.prompt(state, new ShowCardsPrompt(opponent.id, GameMessage.CARDS_SHOWED_BY_THE_OPPONENT, cards),
      () => next());
  }

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

export class MeowthEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX];

  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.COLORLESS];

  public hp: number = 170;

  public weakness = [{ type: CardType.FIGHTING }];

  public retreat = [CardType.COLORLESS];

  public powers = [
    {
      name: 'Last-Ditch Catch',
      powerType: PowerType.ABILITY,
      text: 'Once during your turn, when you play this Pokémon from your hand onto your Bench, you may use ' +
        'this Ability. Search your deck for a Supporter card, reveal it, and put it into your hand. Then, ' +
        'shuffle your deck. You can\'t use more than 1 Ability that has "Last-Ditch" in its name each turn.',
    },
  ];

  public attacks = [
    {
      name: 'Tuck Tail',
      cost: [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
      damage: '60',
      text: 'Put this Pokémon and all attached cards into your hand.',
    },
  ];

  public set: string = 'POR';

  public name: string = 'Meowth ex';

  public fullName: string = 'Meowth ex POR';

  public readonly TUCK_TAIL_MARKER = 'TUCK_TAIL_MARKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PlayPokemonEffect && effect.pokemonCard === this
      && effect.target.pokemons.cards.length === 0) {
      const player = effect.player;
      if (player.marker.hasMarker(LAST_DITCH_MARKER) || player.deck.cards.length === 0) {
        return state;
      }
      // Is something blocking our Ability?
      try {
        store.reduceEffect(state, new PowerEffect(player, this.powers[0], this));
      } catch {
        return state;
      }
      const generator = useLastDitchCatch(() => generator.next(), store, state, effect, this);
      return generator.next().value;
    }

    // Tuck Tail: after the attack's damage, at the end of the turn, back to the hand.
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      effect.player.active.marker.addMarker(this.TUCK_TAIL_MARKER, this);
      return state;
    }

    if (effect instanceof EndTurnEffect) {
      const player = effect.player;
      const slot = StateUtils.findPokemonSlot(state, this);
      if (slot !== undefined && slot.marker.hasMarker(this.TUCK_TAIL_MARKER, this)) {
        slot.moveTo(player.hand);
        slot.clearEffects();
      }
      player.marker.removeMarker(LAST_DITCH_MARKER);
    }

    return state;
  }
}
