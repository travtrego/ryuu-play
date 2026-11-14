import { AttackEffect, CardType, Effect, PokemonCard, Stage, State, StoreLike } from '@ptcg/common';

export class FroakieCRI extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.WATER];

  public hp: number = 70;

  public weakness = [{ type: CardType.LIGHTNING }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    { name: 'Collect', cost: [CardType.COLORLESS], damage: '', text: 'Draw a card.' },
    { name: 'Water Gun', cost: [CardType.WATER], damage: '10', text: '' },
  ];

  public set: string = 'CRI';

  public name: string = 'Froakie';

  public fullName: string = 'Froakie CRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      effect.player.deck.moveTo(effect.player.hand, 1);
    }
    return state;
  }
}
