import {
  Card,
  CardList,
  CardType,
  ChooseCardsPrompt,
  Effect,
  EndTurnEffect,
  GameError,
  GameMessage,
  PokemonCard,
  PowerEffect,
  PowerType,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

export class Drakloak extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom = 'Dreepy';

  public cardTypes: CardType[] = [CardType.DRAGON];

  public hp: number = 90;

  public weakness = [];

  public retreat = [CardType.COLORLESS];

  public powers = [
    {
      name: 'Recon Directive',
      useWhenInPlay: true,
      powerType: PowerType.ABILITY,
      text: 'Once during your turn, you may look at the top 2 cards of your deck and put 1 of them into ' +
        'your hand. Put the other card on the bottom of your deck.',
    },
  ];

  public attacks = [
    { name: 'Dragon Headbutt', cost: [CardType.FIRE, CardType.PSYCHIC], damage: '70', text: '' },
  ];

  public set: string = 'TWM';

  public name: string = 'Drakloak';

  public fullName: string = 'Drakloak TWM';

  public readonly RECON_DIRECTIVE_MARKER = 'RECON_DIRECTIVE_MARKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;
      if (StateUtils.findPokemonSlot(state, this) === undefined || player.deck.cards.length === 0) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      if (player.marker.hasMarker(this.RECON_DIRECTIVE_MARKER, this)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }
      player.marker.addMarker(this.RECON_DIRECTIVE_MARKER, this);

      const deckTop = new CardList();
      player.deck.moveTo(deckTop, 2);

      return store.prompt(
        state,
        new ChooseCardsPrompt(
          player.id,
          GameMessage.CHOOSE_CARD_TO_HAND,
          deckTop,
          {},
          { min: 1, max: 1, allowCancel: false }
        ),
        selected => {
          const cards: Card[] = selected && selected.length > 0 ? selected : deckTop.cards.slice(0, 1);
          deckTop.moveCardsTo(cards, player.hand);
          // The other card goes on the bottom of the deck.
          deckTop.moveTo(player.deck);
        }
      );
    }

    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(this.RECON_DIRECTIVE_MARKER, this);
    }

    return state;
  }
}
