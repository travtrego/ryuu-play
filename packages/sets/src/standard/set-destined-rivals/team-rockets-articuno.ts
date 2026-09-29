import {
  AbstractAttackEffect,
  AfterDamageEffect,
  ApplyWeaknessEffect,
  AttackEffect,
  CardType,
  DealDamageEffect,
  Effect,
  Player,
  PlayerType,
  PokemonCard,
  PokemonSlot,
  PowerType,
  PutDamageEffect,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';
import { isTeamRocketsPokemon } from './team-rocket-utils';
import { TeamRocketsEnergy } from './team-rockets-energy';

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
      text:
        'Prevent all effects of attacks used by your opponent\'s Pokémon done ' +
        'to your Basic Team Rocket\'s Pokémon. (Existing effects are not ' +
        'removed. Damage is not an effect.)',
    },
  ];

  public attacks = [
    {
      name: 'Dark Frost',
      cost: [CardType.WATER, CardType.COLORLESS, CardType.COLORLESS],
      damage: '60+',
      text:
        'If this Pokémon has any Team Rocket\'s Energy attached, this attack ' +
        'does 60 more damage.',
    },
  ];

  public set: string = 'DRI';

  public name: string = 'Team Rocket\'s Articuno';

  public fullName: string = 'Team Rocket\'s Articuno DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const hasRocketEnergy = effect.player.active.energies.cards
        .some(energy => energy instanceof TeamRocketsEnergy);

      if (hasRocketEnergy) {
        effect.damage += 60;
      }

      return state;
    }

    if (effect instanceof AbstractAttackEffect && this.isShielded(state, effect)) {
      effect.preventDefault = true;
    }

    return state;
  }

  // "Damage is not an effect" - the damage chain passes through untouched, and
  // only the other consequences of an opponent's attack are prevented. Damage
  // counters placed by an effect are not damage, so they stay prevented.
  private isDamage(effect: AbstractAttackEffect): boolean {
    return effect instanceof ApplyWeaknessEffect
      || effect instanceof DealDamageEffect
      || effect instanceof PutDamageEffect
      || effect instanceof AfterDamageEffect;
  }

  private isShielded(state: State, effect: AbstractAttackEffect): boolean {
    if (this.isDamage(effect)) {
      return false;
    }

    const owner = state.players.find(player => this.isInPlay(player));
    if (owner === undefined) {
      return false;
    }

    // Only attacks from the other side are repelled; our own are not.
    if (effect.player === owner) {
      return false;
    }

    const targetCard = effect.target.getPokemonCard();
    return targetCard !== undefined
      && effect.target.isBasic()
      && isTeamRocketsPokemon(targetCard)
      && this.ownsSlot(owner, effect.target);
  }

  private isInPlay(player: Player): boolean {
    let found = false;
    player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (slot, card) => {
      if (card === this) {
        found = true;
      }
    });
    return found;
  }

  private ownsSlot(player: Player, target: PokemonSlot): boolean {
    let owns = false;
    player.forEachPokemon(PlayerType.BOTTOM_PLAYER, slot => {
      if (slot === target) {
        owns = true;
      }
    });
    return owns;
  }
}
