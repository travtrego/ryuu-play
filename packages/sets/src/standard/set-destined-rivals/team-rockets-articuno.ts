import {
  AbstractAttackEffect,
  AfterDamageEffect,
  ApplyWeaknessEffect,
  AttackEffect,
  CardType,
  DealDamageEffect,
  Effect,
  PokemonCard,
  PowerEffect,
  PowerType,
  PutDamageEffect,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';
import { isTeamRocketsEnergy, isTeamRocketsPokemon } from './team-rocket-utils';

export class TeamRocketsArticuno extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.WATER];

  public hp: number = 120;

  public weakness = [{ type: CardType.LIGHTNING }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [CardType.COLORLESS];

  public powers = [
    {
      name: 'Repelling Veil',
      powerType: PowerType.ABILITY,
      text: 'Prevent all effects of attacks used by your opponent\'s Pokémon done to your ' +
        'Basic Team Rocket\'s Pokémon. (Existing effects are not removed. Damage is not an effect.)',
    },
  ];

  public attacks = [
    {
      name: 'Dark Frost',
      cost: [CardType.WATER, CardType.COLORLESS, CardType.COLORLESS],
      damage: '60+',
      text: 'If this Pokémon has any Team Rocket\'s Energy attached, this attack does 60 more damage.',
    },
  ];

  public set: string = 'DRI';

  public name: string = 'Team Rocket\'s Articuno';

  public fullName: string = 'Team Rocket\'s Articuno DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      if (effect.player.active.energies.cards.some(c => isTeamRocketsEnergy(c))) {
        effect.damage += 60;
      }
      return state;
    }

    // Repelling Veil: block attack effects, but never the damage itself.
    if (effect instanceof AbstractAttackEffect
      && !(effect instanceof DealDamageEffect)
      && !(effect instanceof PutDamageEffect)
      && !(effect instanceof ApplyWeaknessEffect)
      && !(effect instanceof AfterDamageEffect)) {

      const mySlot = StateUtils.findPokemonSlot(state, this);
      if (mySlot === undefined || mySlot.getPokemonCard() !== this) {
        return state;
      }
      const owner = StateUtils.findOwner(state, mySlot);
      if (effect.player === owner) {
        return state;
      }

      const targetCard = effect.target.getPokemonCard();
      if (targetCard === undefined
        || targetCard.stage !== Stage.BASIC
        || !isTeamRocketsPokemon(targetCard)
        || StateUtils.findOwner(state, effect.target) !== owner) {
        return state;
      }

      // Is something blocking our Ability?
      try {
        store.reduceEffect(state, new PowerEffect(owner, this.powers[0], this));
      } catch {
        return state;
      }

      effect.preventDefault = true;
    }

    return state;
  }
}
