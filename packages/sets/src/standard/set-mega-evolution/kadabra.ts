import { CardType, Effect, EvolveEffect, PokemonCard, PowerType, Stage, State, StoreLike } from '@ptcg/common';
import { psychicDraw } from './psychic-draw';

export class Kadabra extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom = 'Abra';

  public cardTypes: CardType[] = [CardType.PSYCHIC];

  public hp: number = 80;

  public weakness = [{ type: CardType.DARK }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [CardType.COLORLESS];

  public powers = [
    {
      name: 'Psychic Draw',
      powerType: PowerType.ABILITY,
      text: 'Once during your turn, when you play this Pokémon from your hand to evolve 1 of your Pokémon, ' +
        'you may use this Ability. Draw 2 cards.',
    },
  ];

  public attacks = [
    { name: 'Super Psy Bolt', cost: [CardType.PSYCHIC], damage: '30', text: '' },
  ];

  public set: string = 'MEG';

  public name: string = 'Kadabra';

  public fullName: string = 'Kadabra MEG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof EvolveEffect && effect.pokemonCard === this) {
      return psychicDraw(store, state, effect, this, 2);
    }
    return state;
  }
}
