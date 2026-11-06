import {
  AttachEnergyEffect,
  Card,
  CardType,
  CheckPokemonTypeEffect,
  ChooseCardsPrompt,
  Effect,
  EnergyCard,
  EnergyType,
  GameMessage,
  PokemonCard,
  ShuffleDeckPrompt,
  Stage,
  State,
  StoreLike,
  SuperType,
} from '@ptcg/common';

export class TelepathicPsychicEnergy extends EnergyCard {
  public provides: CardType[] = [CardType.PSYCHIC];

  public energyType = EnergyType.SPECIAL;

  public set: string = 'POR';

  public name: string = 'Telepathic Psychic Energy';

  public fullName: string = 'Telepathic Psychic Energy POR';

  public text: string =
    'As long as this card is attached to a Pokémon, it provides P Energy. When you attach this card from your ' +
    'hand to a P Pokémon, search your deck for up to 2 Basic P Pokémon and put them onto your Bench. Then, ' +
    'shuffle your deck.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttachEnergyEffect && effect.energyCard === this
      && effect.player.hand.cards.includes(this)) {
      const player = effect.player;
      const type = new CheckPokemonTypeEffect(effect.target);
      store.reduceEffect(state, type);
      const slots = player.bench.filter(b => b.pokemons.cards.length === 0);
      if (!type.cardTypes.includes(CardType.PSYCHIC) || slots.length === 0 || player.deck.cards.length === 0) {
        return state;
      }

      const blocked: number[] = [];
      player.deck.cards.forEach((card, index) => {
        if (!(card instanceof PokemonCard) || !card.cardTypes.includes(CardType.PSYCHIC)) {
          blocked.push(index);
        }
      });

      return store.prompt(state, new ChooseCardsPrompt(
        player.id,
        GameMessage.CHOOSE_CARD_TO_PUT_ONTO_BENCH,
        player.deck,
        { superType: SuperType.POKEMON, stage: Stage.BASIC },
        { min: 0, max: Math.min(2, slots.length), allowCancel: true, blocked }
      ), selected => {
        const cards: Card[] = selected || [];
        cards.slice(0, slots.length).forEach((card, index) => {
          player.deck.moveCardTo(card, slots[index].pokemons);
          slots[index].pokemonPlayedTurn = state.turn;
        });
        store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
          player.deck.applyOrder(order);
        });
      });
    }
    return state;
  }
}
