import {
  AttackEffect,
  CardType,
  ChooseCardsPrompt,
  Effect,
  GameMessage,
  PokemonCard,
  Stage,
  State,
  StoreLike,
  SuperType,
} from '@ptcg/common';

export class Slowpoke extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.PSYCHIC];

  public hp: number = 80;

  public weakness = [{ type: CardType.DARK }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Dangle Tail',
      cost: [CardType.COLORLESS],
      damage: '',
      text: 'Put a Pokémon from your discard pile into your hand.',
    },
    {
      name: 'Tackle',
      cost: [CardType.PSYCHIC, CardType.COLORLESS],
      damage: '30',
      text: '',
    },
  ];

  public set: string = 'SCR';

  public name: string = 'Slowpoke';

  public fullName: string = 'Slowpoke SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      if (!player.discard.cards.some(c => c instanceof PokemonCard)) {
        return state;
      }
      return store.prompt(state, new ChooseCardsPrompt(
        player.id,
        GameMessage.CHOOSE_CARD_TO_HAND,
        player.discard,
        { superType: SuperType.POKEMON },
        { min: 1, max: 1, allowCancel: false }
      ), selected => {
        player.discard.moveCardsTo(selected || [], player.hand);
      });
    }
    return state;
  }
}
