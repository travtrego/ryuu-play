import {
  AttackEffect,
  Card,
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

export class Duskull extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.PSYCHIC];

  public hp: number = 60;

  public weakness = [{ type: CardType.DARK }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Come and Get You',
      cost: [CardType.PSYCHIC],
      damage: '',
      text: 'Put up to 3 Duskull from your discard pile onto your Bench.',
    },
    { name: 'Mumble', cost: [CardType.PSYCHIC, CardType.PSYCHIC], damage: '30', text: '' },
  ];

  public set: string = 'PRE';

  public name: string = 'Duskull';

  public fullName: string = 'Duskull PRE';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      const slots = player.bench.filter(b => b.pokemons.cards.length === 0);
      const hasDuskull = player.discard.cards.some(c => c instanceof PokemonCard && c.name === 'Duskull');
      if (slots.length === 0 || !hasDuskull) {
        return state;
      }
      return store.prompt(state, new ChooseCardsPrompt(
        player.id,
        GameMessage.CHOOSE_CARD_TO_PUT_ONTO_BENCH,
        player.discard,
        { superType: SuperType.POKEMON, name: 'Duskull' },
        { min: 0, max: Math.min(3, slots.length), allowCancel: true }
      ), selected => {
        const cards: Card[] = selected || [];
        cards.slice(0, slots.length).forEach((card, index) => {
          player.discard.moveCardTo(card, slots[index].pokemons);
          slots[index].pokemonPlayedTurn = state.turn;
        });
      });
    }
    return state;
  }
}
