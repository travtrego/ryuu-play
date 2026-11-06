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
  StateUtils,
  StoreLike,
} from '@ptcg/common';

export class Dudunsparce extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom = 'Dunsparce';

  public cardTypes: CardType[] = [CardType.COLORLESS];

  public hp: number = 140;

  public weakness = [{ type: CardType.FIGHTING }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS];

  public powers = [
    {
      name: 'Run Away Draw',
      useWhenInPlay: true,
      powerType: PowerType.ABILITY,
      text: 'Once during your turn, you may draw 3 cards. If you drew any cards in this way, shuffle this ' +
        'Pokémon and all attached cards into your deck.',
    },
  ];

  public attacks = [
    { name: 'Land Crush', cost: [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS], damage: '90', text: '' },
  ];

  public set: string = 'TEF';

  public name: string = 'Dudunsparce';

  public fullName: string = 'Dudunsparce TEF';

  public readonly RUN_AWAY_DRAW_MARKER = 'RUN_AWAY_DRAW_MARKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;
      const slot = StateUtils.findPokemonSlot(state, this);
      if (slot === undefined || player.deck.cards.length === 0) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      if (player.marker.hasMarker(this.RUN_AWAY_DRAW_MARKER, this)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }
      // Shuffling the last Pokémon in play into the deck would leave no Pokémon at all.
      let inPlay = 0;
      [player.active, ...player.bench].forEach(s => { inPlay += s.pokemons.cards.length > 0 ? 1 : 0; });
      if (inPlay <= 1) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }

      player.marker.addMarker(this.RUN_AWAY_DRAW_MARKER, this);
      player.deck.moveTo(player.hand, 3);
      slot.moveTo(player.deck);
      slot.clearEffects();

      return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
        player.deck.applyOrder(order);
      });
    }

    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(this.RUN_AWAY_DRAW_MARKER, this);
    }

    return state;
  }
}
