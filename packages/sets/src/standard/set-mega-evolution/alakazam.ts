import {
  AttackEffect,
  CardType,
  Effect,
  EvolveEffect,
  PokemonCard,
  PowerType,
  PutCountersEffect,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';
import { psychicDraw } from './psychic-draw';

export class Alakazam extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;

  public evolvesFrom = 'Kadabra';

  public cardTypes: CardType[] = [CardType.PSYCHIC];

  public hp: number = 140;

  public weakness = [{ type: CardType.DARK }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [CardType.COLORLESS];

  public powers = [
    {
      name: 'Psychic Draw',
      powerType: PowerType.ABILITY,
      text: 'Once during your turn, when you play this Pokémon from your hand to evolve 1 of your Pokémon, ' +
        'you may use this Ability. Draw 3 cards.',
    },
  ];

  public attacks = [
    {
      name: 'Powerful Hand',
      cost: [CardType.PSYCHIC],
      damage: '',
      text: 'Place 2 damage counters on your opponent\'s Active Pokémon for each card in your hand.',
    },
  ];

  public set: string = 'MEG';

  public name: string = 'Alakazam';

  public fullName: string = 'Alakazam MEG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof EvolveEffect && effect.pokemonCard === this) {
      return psychicDraw(store, state, effect, this, 3);
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const counters = 2 * effect.player.hand.cards.length;
      if (counters > 0) {
        const put = new PutCountersEffect(effect, 10 * counters);
        put.target = effect.opponent.active;
        store.reduceEffect(state, put);
      }
    }
    return state;
  }
}
