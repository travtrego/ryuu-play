import {
  AbstractAttackEffect,
  AttackEffect,
  CardType,
  Effect,
  PlayerType,
  PokemonCard,
  PowerEffect,
  PowerType,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

export class Rabsca extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom: string = 'Rellor';

  public cardTypes: CardType[] = [CardType.GRASS];

  public hp: number = 70;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS];

  public powers = [
    {
      name: 'Spherical Shield',
      powerType: PowerType.ABILITY,
      text: 'Prevent all damage from and effects of attacks from your opponent\'s Pokémon done to your Benched ' +
        'Pokémon.',
    },
  ];

  public attacks = [
    {
      name: 'Psychic',
      cost: [CardType.GRASS],
      damage: '10+',
      text: 'This attack does 30 more damage for each Energy attached to your opponent\'s Active Pokémon.',
    },
  ];

  public set: string = 'TEF';

  public name: string = 'Rabsca';

  public fullName: string = 'Rabsca TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AbstractAttackEffect) {
      const owner = StateUtils.findOwner(state, effect.target);
      if (owner === effect.player || !owner.bench.includes(effect.target)) {
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
      // A passive Ability: only checked, never used.
      return state;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      effect.damage += 30 * effect.opponent.active.energies.cards.length;
    }

    return state;
  }
}
