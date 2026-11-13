import {
  AttackEffect,
  CardType,
  Effect,
  PokemonCard,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

export class SolrockMEG extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.FIGHTING];

  public hp: number = 110;

  public weakness = [{ type: CardType.GRASS }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Cosmic Beam',
      cost: [CardType.FIGHTING],
      damage: '70',
      text: 'If you don\'t have Lunatone on your Bench, this attack does nothing. This attack\'s damage isn\'t ' +
        'affected by Weakness or Resistance.',
    },
  ];

  public set: string = 'MEG';

  public name: string = 'Solrock';

  public fullName: string = 'Solrock MEG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const hasLunatone = effect.player.bench.some(b => {
        const card = b.getPokemonCard();
        return card !== undefined && card.name === 'Lunatone';
      });
      if (!hasLunatone) {
        effect.damage = 0;
        return state;
      }
      effect.ignoreWeakness = true;
      effect.ignoreResistance = true;
    }
    return state;
  }
}
