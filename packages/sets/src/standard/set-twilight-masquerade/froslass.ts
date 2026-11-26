import {
  BetweenTurnsEffect,
  CardType,
  Effect,
  PokemonCard,
  PowerEffect,
  PowerType,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';
import { HideNSneak } from '../set-pitch-black/hide-n-sneak';
import { TeamRocketsWatchtower } from '../set-destined-rivals/team-rockets-watchtower';

/** Froslass — Twilight Masquerade 53/167. */
export class FroslassTWM extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom = 'Snorunt';

  public cardTypes: CardType[] = [CardType.WATER];

  public hp: number = 90;

  public weakness = [{ type: CardType.METAL }];

  public retreat = [CardType.COLORLESS];

  public powers = [
    {
      name: 'Freezing Shroud',
      powerType: PowerType.ABILITY,
      text: 'During Pokémon Checkup, put 1 damage counter on each Pokémon in play that has an Ability, except ' +
        'any Froslass.',
    },
  ];

  public attacks = [
    { name: 'Frost Smash', cost: [CardType.WATER, CardType.COLORLESS], damage: '60', text: '' },
  ];

  public set: string = 'TWM';

  public name: string = 'Froslass';

  public fullName: string = 'Froslass TWM';

  public static hasAbility(card: PokemonCard | undefined): boolean {
    return card !== undefined && card.powers.some(p => p.powerType === PowerType.ABILITY);
  }

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Pokémon Checkup runs one BetweenTurnsEffect per player; each Froslass
    // acts once, on its owner's.
    if (effect instanceof BetweenTurnsEffect) {
      const owner = effect.player;
      const slot = StateUtils.findPokemonSlot(state, this);
      if (slot === undefined || slot.getPokemonCard() !== this || StateUtils.findOwner(state, slot) !== owner) {
        return state;
      }
      try {
        store.reduceEffect(state, new PowerEffect(owner, this.powers[0], this));
      } catch {
        return state;
      }
      for (const player of state.players) {
        for (const target of [player.active, ...player.bench]) {
          const card = target.getPokemonCard();
          if (card === undefined || card.name === this.name || !FroslassTWM.hasAbility(card)) {
            continue;
          }
          // A Pokémon that "has no Abilities" right now is skipped.
          if (TeamRocketsWatchtower.removesAbilities(store, state, target)) {
            continue;
          }
          if (player !== owner && HideNSneak.protects(store, state, owner, target)) {
            continue;
          }
          target.damage += 10;
        }
      }
      return state;
    }

    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      // A passive Ability: only checked (see above), never used.
      return state;
    }

    return state;
  }
}
