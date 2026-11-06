import { AttackEffect, CardType, Effect, PokemonCard, Stage, State, StoreLike } from '@ptcg/common';

export class TorchicDRI extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.FIRE];

  public hp: number = 70;

  public weakness = [{ type: CardType.WATER }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    { name: 'Collect', cost: [CardType.COLORLESS], damage: '', text: 'Draw a card.' },
    { name: 'Combustion', cost: [CardType.FIRE], damage: '10', text: '' },
  ];

  public set: string = 'DRI';

  public name: string = 'Torchic';

  public fullName: string = 'Torchic DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      effect.player.deck.moveTo(effect.player.hand, 1);
    }
    return state;
  }
}
