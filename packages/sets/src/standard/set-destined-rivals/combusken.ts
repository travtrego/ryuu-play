import { AttackEffect, CardType, CoinFlipPrompt, Effect, GameMessage, PokemonCard, Stage, State, StoreLike } from '@ptcg/common';

export class CombuskenDRI extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom = 'Torchic';

  public cardTypes: CardType[] = [CardType.FIRE];

  public hp: number = 100;

  public weakness = [{ type: CardType.WATER }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    { name: 'Combustion', cost: [CardType.COLORLESS], damage: '20', text: '' },
    {
      name: 'Double Kick',
      cost: [CardType.FIRE, CardType.COLORLESS],
      damage: '40×',
      text: 'Flip 2 coins. This attack does 40 damage for each heads.',
    },
  ];

  public set: string = 'DRI';

  public name: string = 'Combusken';

  public fullName: string = 'Combusken DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      const player = effect.player;
      return store.prompt(state, [
        new CoinFlipPrompt(player.id, GameMessage.COIN_FLIP),
        new CoinFlipPrompt(player.id, GameMessage.COIN_FLIP)
      ], results => {
        const heads = (results as boolean[]).filter(r => r === true).length;
        effect.damage = 40 * heads;
      });
    }
    return state;
  }
}
