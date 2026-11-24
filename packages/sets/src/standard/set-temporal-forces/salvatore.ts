import {
  Card,
  CardTarget,
  CheckPokemonPlayedTurnEffect,
  ChooseCardsPrompt,
  ChoosePokemonPrompt,
  Effect,
  EvolveEffect,
  GameError,
  GameMessage,
  Player,
  PlayerType,
  PokemonCard,
  PokemonSlot,
  PowerType,
  ShuffleDeckPrompt,
  SlotType,
  State,
  StoreLike,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

function hasAbility(card: PokemonCard): boolean {
  return card.powers.some(p => p.powerType === PowerType.ABILITY);
}

/**
 * Pokémon Salvatore may evolve. Besides the usual "in play since the start of
 * this turn", the card allows a Pokémon put down during setup or put into
 * play this turn. A Pokémon that already evolved this turn was neither, so it
 * still waits (`isBasic()` tells a Basic put into play this turn apart from a
 * Pokémon that evolved this turn).
 */
function evolvableSlots(store: StoreLike, state: State, player: Player): PokemonSlot[] {
  const slots: PokemonSlot[] = [];
  player.forEachPokemon(PlayerType.BOTTOM_PLAYER, slot => {
    const played = new CheckPokemonPlayedTurnEffect(player, slot);
    store.reduceEffect(state, played);
    if (played.pokemonPlayedTurn < state.turn || slot.isBasic()) {
      slots.push(slot);
    }
  });
  return slots;
}

function canEvolve(slot: PokemonSlot, card: PokemonCard): boolean {
  const current = slot.getPokemonCard();
  return current !== undefined && current.name === card.evolvesFrom && current.stage < card.stage;
}

function* playCard(next: Function, store: StoreLike, state: State, effect: TrainerEffect): IterableIterator<State> {
  const player = effect.player;

  if (player.deck.cards.length === 0) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  const slots = evolvableSlots(store, state, player);
  const blocked: number[] = [];
  player.deck.cards.forEach((card, index) => {
    const ok = card instanceof PokemonCard && !hasAbility(card) && slots.some(s => canEvolve(s, card));
    if (!ok) {
      blocked.push(index);
    }
  });

  let cards: Card[] = [];
  if (blocked.length < player.deck.cards.length) {
    yield store.prompt(state, new ChooseCardsPrompt(
      player.id,
      GameMessage.CHOOSE_CARD_TO_EVOLVE,
      player.deck,
      {},
      { min: 0, max: 1, allowCancel: true, blocked }
    ), selected => {
      cards = selected || [];
      next();
    });
  }

  if (cards.length > 0) {
    const evolution = cards[0] as PokemonCard;
    const targets = slots.filter(s => canEvolve(s, evolution));
    let target: PokemonSlot | undefined = targets[0];

    if (targets.length > 1) {
      const blockedTargets: CardTarget[] = [];
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (slot, card, t) => {
        if (!targets.includes(slot)) {
          blockedTargets.push(t);
        }
      });
      yield store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_EVOLVE,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.ACTIVE, SlotType.BENCH],
        { allowCancel: false, blocked: blockedTargets }
      ), result => {
        target = result && result.length > 0 ? result[0] : undefined;
        next();
      });
    }

    if (target !== undefined) {
      // EvolveEffect moves the card from the hand onto the Pokémon.
      player.deck.moveCardTo(evolution, player.hand);
      try {
        store.reduceEffect(state, new EvolveEffect(player, target, evolution));
      } catch (error) {
        player.hand.moveCardTo(evolution, player.deck);
        throw error;
      }
    }
  }

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

export class Salvatore extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public set: string = 'TEF';

  public name: string = 'Salvatore';

  public fullName: string = 'Salvatore TEF';

  public text: string =
    'Search your deck for a card that has no Abilities and evolves from 1 of your Pokémon, and put it onto ' +
    'that Pokémon to evolve it. Then, shuffle your deck. You can use this card on a Pokémon you put down when ' +
    'you were setting up to play or on a Pokémon that was put into play this turn.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }
    return state;
  }
}
