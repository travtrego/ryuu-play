import { Attack, PokemonCard, PokemonSlot } from '@ptcg/common';

/**
 * True when the attack stops the attacking Pokémon from attacking (or from
 * using one of its attacks) during its owner's next turn, for example
 * "During your next turn, this Pokémon can't attack." or "Onix can't attack
 * during your next turn." Locks on the opponent's Pokémon ("The Defending
 * Pokémon can't attack during your opponent's next turn") and retreat locks
 * do not count.
 */
export function locksOwnAttackNextTurn(attack: Attack): boolean {
  const sentences = (attack.text || '').split('.');
  return sentences.some(raw => {
    const s = raw.replace(/’/g, '\'').toLowerCase();
    if (!/can't (attack|use )/.test(s) || !/during your next turn/.test(s)) {
      return false;
    }
    return !/defending|opponent/.test(s);
  });
}

/** Leading number of a printed damage, e.g. 250 for '250', 20 for '20×'. */
export function printedDamage(attack: Attack): number {
  return parseInt(attack.damage, 10) || 0;
}

/**
 * A rough estimate of whether the printed damage alone
 * Knocks Out the defender: printed damage, doubled when the defender has a
 * modern (×2, no value) Weakness to one of the attacker's types. The printed HP is
 * used (HP-raising Tools are ignored), and so are Resistance, damage boosts
 * and reductions; this is only used to break ties
 * between attacks, never to decide whether to attack.
 */
export function printedDamageKnocksOut(attack: Attack, attacker: PokemonCard | undefined,
  defender: PokemonSlot): boolean {
  const target = defender.getPokemonCard();
  if (target === undefined) {
    return false;
  }
  let damage = printedDamage(attack);
  if (damage <= 0) {
    return false;
  }
  if (attacker !== undefined && target.weakness.some(w => w.value === undefined
    && attacker.cardTypes.includes(w.type))) {
    damage *= 2;
  }
  return damage >= target.hp - defender.damage;
}
