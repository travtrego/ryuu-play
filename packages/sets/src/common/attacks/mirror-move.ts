import {
  AddSpecialConditionsEffect,
  AfterDamageEffect,
  AttackEffect,
  Effect,
  EndTurnEffect,
  GamePhase,
  PlayerType,
  PokemonCard,
  SpecialCondition,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

import { CommonAttack } from '../common.interfaces';


const DAMAGE_MARKER_PREFIX = 'MIRROR_MOVE_DAMAGE_';

const CONDITION_MARKER_PREFIX = 'MIRROR_MOVE_CONDITION_';

/**
 * Mirror Move was printed with two different wordings, and they do not copy
 * the same things. The card decides which one it got.
 *
 * FINAL_RESULT - "do the final result of that attack on X to the Defending
 * Pokémon" (Pidgeotto BS, Spearow JU). Copies the damage and any Special
 * Condition the attack applied:
 *
 *   Q. Can Spearow's Mirror Move poison the opponent if (let's say) the final
 *      result of the last attack was 30 damage and poison?
 *   A. Yup! It would do 30 damage and Poison.
 *   (May 4, 2000 WotC Chat, Q28)
 *
 *   "If the attack also has a special condition, you would do that back as
 *   well (like poison)."
 *   (Feb 7, 2002 WotC Chat, Q300 & Q302; Feb 14, 2002 WotC Chat, Q12, Q18, Q39)
 *
 * DAMAGE_ONLY - "this attack does the same amount of damage done to X to the
 * Defending Pokémon" (Pidgeot DP:Secret Wonders onwards). Reworded to copy
 * damage and nothing else:
 *
 *   A. No. Placing damage counters is an effect. Mirror Move does not copy any
 *      other types of effects from the last attack either.
 *   (Evolutions FAQ, Nov 3, 2016 TPCi Rules Team)
 *
 * No card in this package uses DAMAGE_ONLY yet; it exists so the later
 * reprints can be added without changing how the originals behave.
 */
export type MirrorMoveWording = 'final result' | 'damage only';

export const mirrorMove: CommonAttack<[wording: MirrorMoveWording]> = function(
  self: PokemonCard,
  store: StoreLike,
  state: State,
  effect: Effect
) {

  // Both halves of "the final result of that attack on Pidgeotto" are recorded,
  // whichever wording the card has. Only `use` decides what to play back.
  function reduceEffect() {
    // Remember damage done to Pidgeotto by the opponent's attacks. Damage taken
    // on the Bench counts too:
    //   Q. If an opponent's attack damages my benched Pidgeotto, can Pidgeotto
    //      then do "Mirror Move" during my next turn and attack for the amount
    //      of damage it received while on the bench?
    //   A. Yes. (May 23, 2002 WotC Chat, Q273)
    if (effect instanceof AfterDamageEffect && effect.target.pokemons.cards.includes(self)) {
      const targetPlayer = StateUtils.findOwner(state, effect.target);

      // No damage, or damage done by itself
      if (effect.damage <= 0 || effect.player === targetPlayer) {
        return state;
      }

      // Pokemon is evolved, Not an attack
      if (effect.target.getPokemonCard() !== self || state.phase !== GamePhase.ATTACK) {
        return state;
      }

      effect.target.marker.addMarker(DAMAGE_MARKER_PREFIX + effect.damage, self);
    }

    // Remember Special Conditions the opponent's attack put on Pidgeotto
    if (effect instanceof AddSpecialConditionsEffect && effect.target.pokemons.cards.includes(self)) {
      const targetPlayer = StateUtils.findOwner(state, effect.target);

      // Condition applied by itself
      if (effect.player === targetPlayer) {
        return state;
      }

      // Pokemon is evolved, Not an attack
      if (effect.target.getPokemonCard() !== self || state.phase !== GamePhase.ATTACK) {
        return state;
      }

      for (const condition of effect.specialConditions) {
        effect.target.marker.addMarker(CONDITION_MARKER_PREFIX + condition, self);
      }
    }

    // Clear markers at the end of the owner's turn. Covers the Bench, because
    // that is where the damage above may have been recorded.
    if (effect instanceof EndTurnEffect) {
      effect.player.forEachPokemon(PlayerType.BOTTOM_PLAYER, pokemonSlot => {
        const markers = pokemonSlot.marker.markers.filter(c => c.source === self);
        for (const marker of markers) {
          pokemonSlot.marker.removeMarker(marker.name, marker.source);
        }
      });
    }

    return state;
  }

  state = reduceEffect();

  return {
    use: (attackEffect: AttackEffect, wording: MirrorMoveWording) => {
      const player = attackEffect.player;
      const markers = player.active.marker.markers.filter(c => c.source === self);

      if (markers.length === 0) {
        return state;
      }

      // Most recent attack, if Pidgeotto was damaged more than once
      const damageMarkers = markers.filter(c => c.name.startsWith(DAMAGE_MARKER_PREFIX));
      const damageMarker = damageMarkers[damageMarkers.length - 1];

      if (damageMarker !== undefined) {
        const damage = parseInt(damageMarker.name.substring(DAMAGE_MARKER_PREFIX.length), 10);
        if (damage > 0) {
          attackEffect.damage = damage;
        }
      }

      if (wording === 'damage only') {
        return state;
      }

      const conditions: SpecialCondition[] = markers
        .filter(c => c.name.startsWith(CONDITION_MARKER_PREFIX))
        .map(c => parseInt(c.name.substring(CONDITION_MARKER_PREFIX.length), 10));

      if (conditions.length > 0) {
        state = store.reduceEffect(state, new AddSpecialConditionsEffect(attackEffect, conditions));
      }

      return state;
    }
  };

};
