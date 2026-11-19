import {
  AttachEnergyPrompt,
  CardTarget,
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

function isBasicDark(card: unknown): boolean {
  return card instanceof EnergyCard
    && card.energyType === EnergyType.BASIC
    && card.provides.includes(CardType.DARK);
}

function* useSinisterSurge(next: Function, store: StoreLike, state: State, effect: PowerEffect): IterableIterator<State> {
  const player = effect.player;

  const blockedTo: CardTarget[] = [];
  player.bench.forEach((slot, index) => {
    const pokemon = slot.getPokemonCard();
    if (pokemon === undefined || !pokemon.cardTypes.includes(CardType.DARK)) {
      blockedTo.push({ player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index });
    }
  });

  if (player.deck.cards.some(isBasicDark)) {
    yield store.prompt(state, new AttachEnergyPrompt(
      player.id,
      GameMessage.ATTACH_ENERGY_TO_BENCH,
      player.deck,
      PlayerType.BOTTOM_PLAYER,
      [SlotType.BENCH],
      { superType: SuperType.ENERGY, energyType: EnergyType.BASIC, provides: [CardType.DARK] },
      { min: 0, max: 1, allowCancel: false, blockedTo }
    ), transfers => {
      for (const transfer of transfers || []) {
        const target = StateUtils.getTarget(state, player, transfer.to);
        player.deck.moveCardTo(transfer.card, target.energies);
        // "If you attached Energy this way, put 2 damage counters on that Pokémon."
        target.damage += 20;
      }
      next();
    });
  }

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

export class ToxtricityPFL extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom = 'Toxel';

  public cardTypes: CardType[] = [CardType.DARK];

  public hp: number = 140;

  public weakness = [{ type: CardType.FIGHTING }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public powers = [
    {
      name: 'Sinister Surge',
      useWhenInPlay: true,
      powerType: PowerType.ABILITY,
      text: 'Once during your turn, you may search your deck for a Basic D Energy card and attach it to 1 of ' +
        'your Benched D Pokémon. Then, shuffle your deck. If you attached Energy this way, put 2 damage ' +
        'counters on that Pokémon.',
    },
  ];

  public attacks = [
    { name: 'Gentle Slap', cost: [CardType.DARK, CardType.DARK, CardType.COLORLESS], damage: '100', text: '' },
  ];

  public set: string = 'PFL';

  public name: string = 'Toxtricity';

  public fullName: string = 'Toxtricity PFL';

  public readonly SINISTER_SURGE_MARKER = 'SINISTER_SURGE_MARKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;
      if (StateUtils.findPokemonSlot(state, this) === undefined || player.deck.cards.length === 0) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      const hasTarget = player.bench.some(slot => {
        const pokemon = slot.getPokemonCard();
        return pokemon !== undefined && pokemon.cardTypes.includes(CardType.DARK);
      });
      if (!hasTarget) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      if (player.marker.hasMarker(this.SINISTER_SURGE_MARKER, this)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }
      player.marker.addMarker(this.SINISTER_SURGE_MARKER, this);
      const generator = useSinisterSurge(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(this.SINISTER_SURGE_MARKER, this);
    }

    return state;
  }
}
