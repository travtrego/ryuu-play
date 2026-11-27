import {
  AttackEffect,
  Card,
  CardTag,
  CardType,
  ChooseCardsPrompt,
  Effect,
  GameError,
  GameMessage,
  Player,
  PlayerType,
  PokemonCard,
  PowerEffect,
  PowerType,
  ShuffleDeckPrompt,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

function* useTalonHunt(next: Function, store: StoreLike, state: State, effect: AttackEffect): IterableIterator<State> {
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
    { min: 0, max: Math.min(2, player.deck.cards.length), allowCancel: true }
  ), selected => {
    cards = selected || [];
    next();
  });

  player.deck.moveCardsTo(cards, player.hand);

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

/** Talonflame ex — Delta Reign 88. */
export class TalonflameEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX];

  public stage: Stage = Stage.STAGE_2;

  public evolvesFrom = 'Fletchinder';

  public cardTypes: CardType[] = [CardType.COLORLESS];

  public hp: number = 280;

  public weakness = [{ type: CardType.LIGHTNING }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat: CardType[] = [];

  public powers = [
    {
      name: 'Excited Dive',
      useFromHand: true,
      powerType: PowerType.ABILITY,
      text: 'Once during your turn, if this Pokémon is in your hand and you have any C Mega Evolution Pokémon ex ' +
        'in play, you may use this Ability. Put this Pokémon onto your Bench.',
    },
  ];

  public attacks = [
    {
      name: 'Talon Hunt',
      cost: [CardType.COLORLESS, CardType.COLORLESS],
      damage: '150',
      text: 'You may search your deck for up to 2 cards and put them into your hand. Then, shuffle your deck.',
    },
  ];

  public set: string = 'DLR';

  public name: string = 'Talonflame ex';

  public fullName: string = 'Talonflame ex DLR';

  /** "Any C Mega Evolution Pokémon ex in play" on the player's side. */
  public static hasColorlessMegaInPlay(player: Player): boolean {
    let found = false;
    player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (_slot, card) => {
      if (card.tags.includes(CardTag.MEGA_EVOLUTION_EX) && card.cardTypes.includes(CardType.COLORLESS)) {
        found = true;
      }
    });
    return found;
  }

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;
      if (!player.hand.cards.includes(this) || !TalonflameEx.hasColorlessMegaInPlay(player)) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      const slot = player.bench.find(b => b.pokemons.cards.length === 0);
      if (slot === undefined) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      player.hand.moveCardTo(this, slot.pokemons);
      slot.pokemonPlayedTurn = state.turn;
      return state;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const generator = useTalonHunt(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    return state;
  }
}
