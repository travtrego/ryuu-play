import {
  AttachEnergyPrompt,
  CardList,
  CardType,
  Effect,
  EndTurnEffect,
  EnergyCard,
  EnergyType,
  GameError,
  GameMessage,
  PlayerType,
  PokemonCard,
  PowerEffect,
  PowerType,
  ShuffleDeckPrompt,
  SlotType,
  Stage,
  State,
  StateUtils,
  StoreLike,
  SuperType,
} from '@ptcg/common';

function isBasicMetal(card: unknown): boolean {
  return card instanceof EnergyCard
    && card.energyType === EnergyType.BASIC
    && card.provides.includes(CardType.METAL);
}

function* useMetalMaker(next: Function, store: StoreLike, state: State, effect: PowerEffect): IterableIterator<State> {
  const player = effect.player;

  const deckTop = new CardList();
  player.deck.moveTo(deckTop, 4);

  if (deckTop.cards.some(isBasicMetal)) {
    yield store.prompt(state, new AttachEnergyPrompt(
      player.id,
      GameMessage.ATTACH_ENERGY_CARDS,
      deckTop,
      PlayerType.BOTTOM_PLAYER,
      [SlotType.ACTIVE, SlotType.BENCH],
      { superType: SuperType.ENERGY, energyType: EnergyType.BASIC, provides: [CardType.METAL] },
      { min: 0, max: deckTop.cards.filter(isBasicMetal).length, allowCancel: false }
    ), transfers => {
      for (const transfer of transfers || []) {
        const target = StateUtils.getTarget(state, player, transfer.to);
        deckTop.moveCardTo(transfer.card, target.energies);
      }
      next();
    });
  }

  if (deckTop.cards.length === 0) {
    return state;
  }

  // "Shuffle the other cards and put them on the bottom of your deck": set the
  // rest of the deck aside, shuffle only the looked-at cards, then put them
  // under it.
  const rest = new CardList();
  player.deck.moveTo(rest);
  deckTop.moveTo(player.deck);
  yield store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
    next();
  });
  player.deck.cards = [...rest.cards, ...player.deck.cards];
  return state;
}

export class Metang extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom = 'Beldum';

  public cardTypes: CardType[] = [CardType.METAL];

  public hp: number = 100;

  public weakness = [{ type: CardType.FIRE }];

  public resistance = [{ type: CardType.GRASS, value: -30 }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public powers = [
    {
      name: 'Metal Maker',
      useWhenInPlay: true,
      powerType: PowerType.ABILITY,
      text: 'Once during your turn, you may look at the top 4 cards of your deck and attach any number of ' +
        'Basic M Energy cards you find there to your Pokémon in any way you like. Shuffle the other cards ' +
        'and put them on the bottom of your deck.',
    },
  ];

  public attacks = [
    { name: 'Beam', cost: [CardType.METAL, CardType.COLORLESS, CardType.COLORLESS], damage: '60', text: '' },
  ];

  public set: string = 'TEF';

  public name: string = 'Metang';

  public fullName: string = 'Metang TEF';

  public readonly METAL_MAKER_MARKER = 'METAL_MAKER_MARKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;
      if (StateUtils.findPokemonSlot(state, this) === undefined || player.deck.cards.length === 0) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      if (player.marker.hasMarker(this.METAL_MAKER_MARKER, this)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }
      player.marker.addMarker(this.METAL_MAKER_MARKER, this);
      const generator = useMetalMaker(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(this.METAL_MAKER_MARKER, this);
    }

    return state;
  }
}
