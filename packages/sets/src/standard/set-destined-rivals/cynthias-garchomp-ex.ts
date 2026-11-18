import {
  AttackEffect,
  CardTag,
  CardType,
  ConfirmPrompt,
  DiscardCardsEffect,
  Effect,
  GameMessage,
  PokemonCard,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

export class CynthiasGarchompEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX];

  public stage: Stage = Stage.STAGE_2;

  public evolvesFrom = 'Cynthia\'s Gabite';

  public cardTypes: CardType[] = [CardType.FIGHTING];

  public hp: number = 330;

  public weakness = [{ type: CardType.GRASS }];

  public retreat = [];

  public attacks = [
    {
      name: 'Corkscrew Dive',
      cost: [CardType.FIGHTING],
      damage: '100',
      text: 'You may draw cards until you have 6 cards in your hand.',
    },
    {
      name: 'Draconic Buster',
      cost: [CardType.FIGHTING, CardType.FIGHTING],
      damage: '260',
      text: 'Discard all Energy from this Pokémon.',
    },
  ];

  public set: string = 'DRI';

  public name: string = 'Cynthia\'s Garchomp ex';

  public fullName: string = 'Cynthia\'s Garchomp ex DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      const cardsToDraw = Math.min(6 - player.hand.cards.length, player.deck.cards.length);
      if (cardsToDraw <= 0) {
        return state;
      }
      return store.prompt(state, new ConfirmPrompt(player.id, GameMessage.WANT_TO_DRAW_CARDS), result => {
        if (result) {
          player.deck.moveTo(player.hand, cardsToDraw);
        }
      });
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      const player = effect.player;
      const energies = player.active.energies.cards.slice();
      if (energies.length > 0) {
        const discard = new DiscardCardsEffect(effect, energies);
        discard.target = player.active;
        store.reduceEffect(state, discard);
      }
    }

    return state;
  }
}
