import {
  Card,
  CardManager,
  CardTarget,
  CheckPokemonPlayedTurnEffect,
  ChooseCardsPrompt,
  ChoosePokemonPrompt,
  Effect,
  EvolveEffect,
  GameError,
  GameMessage,
  PlayerType,
  PokemonCard,
  PokemonSlot,
  SlotType,
  Stage,
  State,
  StoreLike,
  SuperType,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

// Unlike the later Rare Candy (common helper, Stage 2 only), this one also allows a Stage 1 card
function canEvolveFrom(stage1: PokemonCard[], basic: PokemonCard, card: PokemonCard): boolean {
  if (card.stage === Stage.STAGE_1) {
    return card.evolvesFrom === basic.name;
  }
  if (card.stage === Stage.STAGE_2) {
    return stage1.some(s => s.name === card.evolvesFrom && s.evolvesFrom === basic.name);
  }
  return false;
}

function* playCard(next: Function, store: StoreLike, state: State, effect: TrainerEffect): IterableIterator<State> {
  const player = effect.player;

  const evolutions = player.hand.cards.filter(c => {
    return c instanceof PokemonCard && (c.stage === Stage.STAGE_1 || c.stage === Stage.STAGE_2);
  }) as PokemonCard[];

  if (evolutions.length === 0) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  // Look through all known cards to find out if it's a valid Stage 2
  const cm = CardManager.getInstance();
  const stage1 = cm.getAllCards().filter(c => {
    return c instanceof PokemonCard && c.stage === Stage.STAGE_1;
  }) as PokemonCard[];

  const blocked: CardTarget[] = [];
  let hasBasicPokemon = false;

  player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (list, card, target) => {
    if (card.stage === Stage.BASIC && evolutions.some(e => canEvolveFrom(stage1, card, e))) {
      const playedTurnEffect = new CheckPokemonPlayedTurnEffect(player, list);
      store.reduceEffect(state, playedTurnEffect);
      if (playedTurnEffect.pokemonPlayedTurn < state.turn) {
        hasBasicPokemon = true;
        return;
      }
    }
    blocked.push(target);
  });

  if (!hasBasicPokemon) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  // We will discard this card after prompt confirmation
  effect.preventDefault = true;

  let targets: PokemonSlot[] = [];
  yield store.prompt(
    state,
    new ChoosePokemonPrompt(
      player.id,
      GameMessage.CHOOSE_POKEMON_TO_EVOLVE,
      PlayerType.BOTTOM_PLAYER,
      [SlotType.ACTIVE, SlotType.BENCH],
      { allowCancel: true, blocked }
    ),
    selection => {
      targets = selection || [];
      next();
    }
  );

  if (targets.length === 0) {
    return state; // canceled by user
  }
  const pokemonCard = targets[0].getPokemonCard();
  if (pokemonCard === undefined) {
    return state; // invalid target?
  }

  const blocked2: number[] = [];
  player.hand.cards.forEach((c, index) => {
    if (c instanceof PokemonCard && !canEvolveFrom(stage1, pokemonCard, c)) {
      blocked2.push(index);
    }
  });

  let cards: Card[] = [];
  return store.prompt(
    state,
    new ChooseCardsPrompt(
      player.id,
      GameMessage.CHOOSE_CARD_TO_EVOLVE,
      player.hand,
      { superType: SuperType.POKEMON },
      { min: 1, max: 1, allowCancel: true, blocked: blocked2 }
    ),
    selected => {
      cards = selected || [];

      if (cards.length > 0) {
        const evolution = cards[0] as PokemonCard;
        const evolveEffect = new EvolveEffect(player, targets[0], evolution);
        store.reduceEffect(state, evolveEffect);

        // Discard trainer only when user selected a Pokemon
        player.hand.moveCardTo(effect.trainerCard, player.discard);
      }
    }
  );
}

export class RareCandy extends TrainerCard {
  public trainerType: TrainerType = TrainerType.ITEM;

  public set: string = 'SS';

  public name: string = 'Rare Candy';

  public fullName: string = 'Rare Candy SS';

  public text: string =
    'Choose 1 of your Basic Pokémon in play. If you have a Stage 1 or Stage 2 card that evolves from that Pokémon ' +
    'in your hand, put that card on the Basic Pokémon. (This counts as evolving that Pokémon.)';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    return state;
  }
}
