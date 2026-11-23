import { Attack } from '@ptcg/common';
import { locksOwnAttackNextTurn } from './attack-utils';

function attack(text: string): Attack {
  return { name: 'Attack', cost: [], damage: '10', text };
}

describe('locksOwnAttackNextTurn', () => {

  it('Should spot the modern wording', () => {
    expect(locksOwnAttackNextTurn(attack('During your next turn, this Pokémon can\'t attack.'))).toBe(true);
    expect(locksOwnAttackNextTurn(attack('During your next turn, this Pokémon can\'t use attacks.'))).toBe(true);
    expect(locksOwnAttackNextTurn(attack('During your next turn, this Pokémon can\'t use Mega Brave.'))).toBe(true);
  });

  it('Should spot the older wording', () => {
    expect(locksOwnAttackNextTurn(attack('Flip a coin. If tails, Onix can\'t attack during your next turn.'))).toBe(true);
    expect(locksOwnAttackNextTurn(attack('This Pokémon can\'t use Bound Crush during your next turn.'))).toBe(true);
  });

  it('Should ignore locks on the opponent and retreat locks', () => {
    expect(locksOwnAttackNextTurn(attack('The Defending Pokémon can\'t attack during your opponent\'s next turn.')))
      .toBe(false);
    expect(locksOwnAttackNextTurn(attack('This Pokémon can\'t retreat during your next turn.'))).toBe(false);
    expect(locksOwnAttackNextTurn(attack(''))).toBe(false);
  });

});
