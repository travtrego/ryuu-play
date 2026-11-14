import {
  Card,
  CardTag,
  CardTarget,
  CheckPokemonPlayedTurnEffect,
  ChooseCardsPrompt,
  ChoosePokemonPrompt,
  Effect,
  GameError,
  GameMessage,
  Player,
  PlayerType,
  PokemonCard,
  PokemonSlot,
  ShuffleDeckPrompt,
  SlotType,
  Stage,
  State,
  StateUtils,
  StoreLike,
  SuperType,
  TrainerCard,
  TrainerType,
  UseStadiumEffect,
} from '@ptcg/common';

/** Basic Pokémon in play that may evolve now (not put into play this turn, not the first turn). */
function evolvableBasics(store: StoreLike, state: State, player: Player): PokemonSlot[] {
  const result: PokemonSlot[] = [];
  player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (slot, card) => {
    if (card.stage !== Stage.BASIC) {
      return;
    }
    const playedTurn = new CheckPokemonPlayedTurnEffect(player, slot);
    store.reduceEffect(state, playedTurn);
    if (playedTurn.pokemonPlayedTurn < state.turn) {
      result.push(slot);
    }
  });
  return result;
}

function evolve(state: State, player: Player, card: PokemonCard, slot: PokemonSlot): void {
  player.deck.moveCardTo(card, slot.pokemons);
  slot.clearEffects();
  slot.pokemonPlayedTurn = state.turn;
}

function* useStadium(next: Function, store: StoreLike, state: State, effect: UseStadiumEffect): IterableIterator<State> {
  const player = effect.player;
  const basics = evolvableBasics(store, state, player);
  const basicNames = basics.map(slot => slot.getPokemonCard()!.name);

  // Only Stage 1 cards that evolve from one of those Basics can be chosen.
  const blocked: number[] = [];
  player.deck.cards.forEach((card, index) => {
    if (!(card instanceof PokemonCard) || card.stage !== Stage.STAGE_1 || !basicNames.includes(card.evolvesFrom)) {
      blocked.push(index);
    }
  });

  let stage1: Card[] = [];
  yield store.prompt(state, new ChooseCardsPrompt(
    player.id,
    GameMessage.CHOOSE_CARD_TO_EVOLVE,
    player.deck,
    { superType: SuperType.POKEMON, stage: Stage.STAGE_1 },
    { min: 0, max: 1, allowCancel: true, blocked }
  ), selected => {
    stage1 = selected || [];
    next();
  });

  if (stage1.length > 0) {
    const evolution = stage1[0] as PokemonCard;
    const blockedTargets: CardTarget[] = [];
    player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (slot, card, target) => {
      if (!basics.includes(slot) || card.name !== evolution.evolvesFrom) {
        blockedTargets.push(target);
      }
    });

    let targets: PokemonSlot[] = [];
    yield store.prompt(state, new ChoosePokemonPrompt(
      player.id,
      GameMessage.CHOOSE_POKEMON_TO_EVOLVE,
      PlayerType.BOTTOM_PLAYER,
      [SlotType.ACTIVE, SlotType.BENCH],
      { allowCancel: false, blocked: blockedTargets }
    ), selected => {
      targets = selected || [];
      next();
    });

    if (targets.length > 0) {
      const slot = targets[0];
      evolve(state, player, evolution, slot);

      // "If that Pokémon was evolved in this way": a Stage 2 from the deck
      // may go straight onto it, in the same turn.
      const blocked2: number[] = [];
      player.deck.cards.forEach((card, index) => {
        if (!(card instanceof PokemonCard) || card.stage !== Stage.STAGE_2 || card.evolvesFrom !== evolution.name) {
          blocked2.push(index);
        }
      });

      let stage2: Card[] = [];
      yield store.prompt(state, new ChooseCardsPrompt(
        player.id,
        GameMessage.CHOOSE_CARD_TO_EVOLVE,
        player.deck,
        { superType: SuperType.POKEMON, stage: Stage.STAGE_2 },
        { min: 0, max: 1, allowCancel: true, blocked: blocked2 }
      ), selected => {
        stage2 = selected || [];
        next();
      });

      if (stage2.length > 0) {
        evolve(state, player, stage2[0] as PokemonCard, slot);
      }
    }
  }

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

export class GrandTree extends TrainerCard {
  public trainerType: TrainerType = TrainerType.STADIUM;

  public tags = [CardTag.ACE_SPEC];

  public set: string = 'SCR';

  public name: string = 'Grand Tree';

  public fullName: string = 'Grand Tree SCR';

  public text: string =
    'Once during each player\'s turn, that player may search their deck for a Stage 1 Pokémon that evolves ' +
    'from 1 of their Basic Pokémon and put it onto that Pokémon to evolve it. If that Pokémon was evolved in ' +
    'this way, that player may search their deck for a Stage 2 Pokémon that evolves from that Pokémon and ' +
    'put it onto that Pokémon to evolve it. Then, that player shuffles their deck. (Players can\'t evolve a ' +
    'Basic Pokémon during their first turn or a Basic Pokémon that was put into play this turn.)';

  public useWhenInPlay = true;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof UseStadiumEffect && StateUtils.getStadiumCard(state) === this) {
      const player = effect.player;
      if (player.deck.cards.length === 0 || evolvableBasics(store, state, player).length === 0) {
        throw new GameError(GameMessage.CANNOT_USE_STADIUM);
      }

      // The engine logs the use and marks the stadium used for this turn,
      // even if the search finds nothing (searching is optional).
      const generator = useStadium(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    return state;
  }
}
