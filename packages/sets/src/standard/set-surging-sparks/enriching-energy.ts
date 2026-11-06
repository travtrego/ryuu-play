import { AttachEnergyEffect, CardType, Effect, EnergyCard, EnergyType, State, StoreLike } from '@ptcg/common';

export class EnrichingEnergy extends EnergyCard {
  public provides: CardType[] = [CardType.COLORLESS];

  public energyType = EnergyType.SPECIAL;

  public set: string = 'SSP';

  public name: string = 'Enriching Energy';

  public fullName: string = 'Enriching Energy SSP';

  public text: string =
    'As long as this card is attached to a Pokémon, it provides C Energy. When you attach this card from your ' +
    'hand to a Pokémon, draw 4 cards.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttachEnergyEffect && effect.energyCard === this
      && effect.player.hand.cards.includes(this)) {
      effect.player.deck.moveTo(effect.player.hand, 4);
    }
    return state;
  }
}
