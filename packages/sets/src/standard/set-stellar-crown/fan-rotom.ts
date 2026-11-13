import {
  AttackEffect,
  Card,
  CardType,
  ChooseCardsPrompt,
  Effect,
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
  SuperType,
} from '@ptcg/common';

export class FanRotom extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.COLORLESS];

  public hp: number = 70;

  public weakness = [{ type: CardType.LIGHTNING }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [CardType.COLORLESS];

  public powers = [
    {
      name: 'Fan Call',
      powerType: PowerType.ABILITY,
      useWhenInPlay: true,
      text: 'Once during your first turn, you may search your deck for up to 3 C Pokémon with 100 HP or less, ' +
        'reveal them, and put them into your hand. Then, shuffle your deck. You can\'t use more than 1 Fan ' +
        'Call Ability during your turn.',
    },
  ];

  public attacks = [
    {
      name: 'Assault Landing',
      cost: [CardType.COLORLESS],
      damage: '70',
      text: 'If there is no Stadium in play, this attack does nothing.',
    },
  ];

  public set: string = 'SCR';

  public name: string = 'Fan Rotom';

  public fullName: string = 'Fan Rotom SCR';

  public readonly FAN_CALL_MARKER = 'FAN_CALL_MARKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;
      // "During your first turn": the first turn each player takes is turns 1 and 2.
      if (state.turn > 2) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      if (player.marker.hasMarker(this.FAN_CALL_MARKER)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }
      player.marker.addMarker(this.FAN_CALL_MARKER, this);

      return store.prompt(state, new ChooseCardsPrompt(
        player.id,
        GameMessage.CHOOSE_CARD_TO_HAND,
        player.deck,
        { superType: SuperType.POKEMON },
        { min: 0, max: 3, allowCancel: false, blocked: blockedIndexes(player.deck.cards) }
      ), selected => {
        const cards = selected || [];
        player.deck.moveCardsTo(cards, player.hand);
        return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
          player.deck.applyOrder(order);
        });
      });
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      if (StateUtils.getStadiumCard(state) === undefined) {
        effect.damage = 0;
      }
    }

    return state;
  }
}

function blockedIndexes(cards: Card[]): number[] {
  const blocked: number[] = [];
  cards.forEach((card, index) => {
    if (!(card instanceof PokemonCard) || !card.cardTypes.includes(CardType.COLORLESS) || card.hp > 100) {
      blocked.push(index);
    }
  });
  return blocked;
}
