import {
  CardType,
  DealDamageEffect,
  Effect,
  PlayerType,
  PokemonCard,
  PowerEffect,
  PowerType,
  PutDamageEffect,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

export class ShayminDRI extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.GRASS];

  public hp: number = 80;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS];

  public powers = [
    {
      name: 'Flower Curtain',
      powerType: PowerType.ABILITY,
      text: 'Prevent all damage done to your Benched Pokémon that don\'t have a Rule Box by attacks from your ' +
        'opponent\'s Pokémon. (Pokémon ex, Pokémon V, etc. have Rule Boxes.)',
    },
  ];

  public attacks = [
    { name: 'Smash Kick', cost: [CardType.COLORLESS, CardType.COLORLESS], damage: '30', text: '' },
  ];

  public set: string = 'DRI';

  public name: string = 'Shaymin';

  public fullName: string = 'Shaymin DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PutDamageEffect || effect instanceof DealDamageEffect) {
      const owner = StateUtils.findOwner(state, effect.target);
      const target = effect.target.getPokemonCard();
      if (owner === effect.player || !owner.bench.includes(effect.target)
        || target === undefined || StateUtils.hasRuleBox(target)) {
        return state;
      }

      let inPlay = false;
      owner.forEachPokemon(PlayerType.BOTTOM_PLAYER, (slot, card) => {
        if (card === this) {
          inPlay = true;
        }
      });
      if (!inPlay) {
        return state;
      }

      try {
        store.reduceEffect(state, new PowerEffect(owner, this.powers[0], this));
      } catch {
        return state;
      }
      effect.preventDefault = true;
      return state;
    }

    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      return state;
    }

    return state;
  }
}
