import {
  AbstractAttackEffect,
  AfterDamageEffect,
  ApplyWeaknessEffect,
  DealDamageEffect,
  Effect,
  Player,
  PokemonCard,
  PokemonSlot,
  PowerEffect,
  PowerType,
  PutDamageEffect,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

/**
 * Hide 'n' Sneak (Pitch Black: Poltchageist, Sinistcha, Shuppet, Banette):
 * "Prevent all effects of your opponent's Pokémon's attacks and Abilities done
 * to this Pokémon. (Damage is not an effect.)"
 *
 * Attacks: every attack effect except damage is prevented (the Mist Energy /
 * Empoleon ex shape), so damage counters placed by an attack, Special
 * Conditions and the like don't land.
 * Abilities: the engine has no general "effect of an Ability" event, so each
 * modern Ability that does something to an opponent's Pokémon asks
 * `HideNSneak.protects` before touching it (Cursed Blast, Adrena-Brain).
 */
export class HideNSneak {

  public static readonly NAME = 'Hide \'n\' Sneak';

  public static readonly TEXT = 'Prevent all effects of your opponent\'s Pokémon\'s attacks and Abilities done to ' +
    'this Pokémon. (Damage is not an effect.)';

  public static power() {
    return { name: HideNSneak.NAME, powerType: PowerType.ABILITY, text: HideNSneak.TEXT };
  }

  public static hasAbility(card: unknown): boolean {
    return card instanceof PokemonCard && card.powers.some(p => p.name === HideNSneak.NAME);
  }

  /** Pokémon with the Hide 'n' Sneak Ability in the player's discard pile. */
  public static countInDiscard(player: Player): number {
    return player.discard.cards.filter(c => HideNSneak.hasAbility(c)).length;
  }

  /**
   * True when `target` is protected from an effect that `player` (the
   * opponent of its owner) causes with an Ability or attack.
   */
  public static protects(store: StoreLike, state: State, player: Player, target: PokemonSlot): boolean {
    const card = target.getPokemonCard();
    if (card === undefined || !HideNSneak.hasAbility(card)) {
      return false;
    }
    const owner = StateUtils.findOwner(state, target);
    if (owner === player) {
      return false;
    }
    const power = card.powers.find(p => p.name === HideNSneak.NAME);
    if (power === undefined) {
      return false;
    }
    // An Ability lock (for example Flutter Mane) turns the protection off.
    try {
      store.reduceEffect(state, new PowerEffect(owner, power, card));
    } catch {
      return false;
    }
    return true;
  }

  /** Call from the card's reduceEffect. Returns true when it handled the effect. */
  public static reduce(self: PokemonCard, store: StoreLike, state: State, effect: Effect): boolean {
    if (effect instanceof PowerEffect && effect.power.name === HideNSneak.NAME && effect.card === self) {
      // A passive Ability: only checked, never used.
      return true;
    }

    if (effect instanceof AbstractAttackEffect
      && effect.target.getPokemonCard() === self
      && !(effect instanceof DealDamageEffect)
      && !(effect instanceof PutDamageEffect)
      && !(effect instanceof ApplyWeaknessEffect)
      && !(effect instanceof AfterDamageEffect)
      && HideNSneak.protects(store, state, effect.player, effect.target)) {
      effect.preventDefault = true;
      return true;
    }

    return false;
  }
}
