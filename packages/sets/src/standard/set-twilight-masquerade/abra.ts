import {
  CardType,
  Effect,
  EndTurnEffect,
  GameError,
  GameMessage,
  PokemonCard,
  PowerEffect,
  PowerType,
  ShuffleDeckPrompt,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

/** Abra — Twilight Masquerade 80/167. */
export class AbraTWM extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.PSYCHIC];

  public hp: number = 40;

  public weakness = [{ type: CardType.DARK }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [CardType.COLORLESS];

  public powers = [
    {
      name: 'Teleporter',
      useWhenInPlay: true,
      powerType: PowerType.ABILITY,
      text: 'Once during your turn, if this Pokémon is in the Active Spot, you may shuffle it and all attached ' +
        'cards into your deck.',
    },
  ];

  public attacks = [
    { name: 'Beam', cost: [CardType.PSYCHIC], damage: '10', text: '' },
  ];

  public set: string = 'TWM';

  public name: string = 'Abra';

  public fullName: string = 'Abra TWM';

  public readonly TELEPORTER_MARKER = 'TELEPORTER_MARKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;
      if (player.active.getPokemonCard() !== this) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      if (player.marker.hasMarker(this.TELEPORTER_MARKER, this)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }
      // With nothing on the Bench this would leave no Pokémon in play (a lost
      // game), so it is refused, as Dudunsparce's Run Away Draw is.
      if (!player.bench.some(b => b.pokemons.cards.length > 0)) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }

      player.marker.addMarker(this.TELEPORTER_MARKER, this);
      const slot = player.active;
      slot.moveTo(player.deck);
      slot.clearEffects();

      // The engine asks for a new Active Pokémon from the Bench once the
      // action is done (checkState).
      return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
        player.deck.applyOrder(order);
      });
    }

    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(this.TELEPORTER_MARKER, this);
    }

    return state;
  }
}
