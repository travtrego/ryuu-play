import { AttackEffect, CardType, Effect, PokemonCard, Stage, State, StateUtils, StoreLike } from '@ptcg/common';

export class ChiYu extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.FIRE];

  public hp: number = 110;

  public weakness = [{ type: CardType.WATER }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    { name: 'Allure', cost: [CardType.COLORLESS], damage: '', text: 'Draw 2 cards.' },
    {
      name: 'Ground Melter',
      cost: [CardType.FIRE, CardType.COLORLESS],
      damage: '60+',
      text: 'If a Stadium is in play, this attack does 60 more damage. Then, discard that Stadium.',
    },
  ];

  public set: string = 'TWM';

  public name: string = 'Chi-Yu';

  public fullName: string = 'Chi-Yu TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      effect.player.deck.moveTo(effect.player.hand, 2);
      return state;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      const stadium = StateUtils.getStadiumCard(state);
      if (stadium !== undefined) {
        effect.damage += 60;
        const list = StateUtils.findCardList(state, stadium);
        const owner = StateUtils.findOwner(state, list);
        list.moveCardTo(stadium, owner.discard);
      }
    }
    return state;
  }
}
