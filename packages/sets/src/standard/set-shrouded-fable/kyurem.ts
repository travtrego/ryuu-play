import {
  AttackEffect,
  CardType,
  CheckAttackCostEffect,
  ChoosePokemonPrompt,
  DiscardCardsEffect,
  Effect,
  GameMessage,
  PlayerType,
  PokemonCard,
  PowerEffect,
  PowerType,
  PutDamageEffect,
  SlotType,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

export class Kyurem extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.DRAGON];

  public hp: number = 130;

  public weakness = [];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public powers = [
    {
      name: 'Plasma Bane',
      powerType: PowerType.ABILITY,
      text: 'If your opponent has any cards in their discard pile that have "Colress" in the name, ' +
        'this Pokémon can use the Trifrost attack for C.',
    },
  ];

  public attacks = [
    {
      name: 'Trifrost',
      cost: [CardType.WATER, CardType.WATER, CardType.METAL, CardType.METAL, CardType.COLORLESS],
      damage: '',
      text: 'Discard all Energy from this Pokémon. This attack does 110 damage to 3 of your opponent\'s ' +
        'Pokémon. (Don\'t apply Weakness and Resistance for Benched Pokémon.)',
    },
  ];

  public set: string = 'SFA';

  public name: string = 'Kyurem';

  public fullName: string = 'Kyurem SFA';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof CheckAttackCostEffect && effect.attack === this.attacks[0]
      && effect.player.active.getPokemonCard() === this) {
      const opponent = StateUtils.getOpponent(state, effect.player);
      if (!opponent.discard.cards.some(c => c.name.includes('Colress'))) {
        return state;
      }
      try {
        store.reduceEffect(state, new PowerEffect(effect.player, this.powers[0], this));
      } catch {
        return state;
      }
      effect.cost = [CardType.COLORLESS];
      return state;
    }

    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      // A passive Ability: only checked (see above), never used.
      return state;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      const opponent = effect.opponent;

      // "This Pokémon" is the attacker (Slowking can copy this attack).
      const energies = player.active.energies.cards.slice();
      if (energies.length > 0) {
        const discard = new DiscardCardsEffect(effect, energies);
        discard.target = player.active;
        store.reduceEffect(state, discard);
      }

      let count = 0;
      opponent.forEachPokemon(PlayerType.TOP_PLAYER, () => { count += 1; });
      count = Math.min(3, count);
      if (count === 0) {
        return state;
      }

      return store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
        PlayerType.TOP_PLAYER,
        [SlotType.ACTIVE, SlotType.BENCH],
        { min: count, max: count, allowCancel: false }
      ), selected => {
        for (const target of selected || []) {
          if (target === opponent.active) {
            effect.damage = 110;
          } else {
            const damage = new PutDamageEffect(effect, 110);
            damage.target = target;
            store.reduceEffect(state, damage);
          }
        }
      });
    }

    return state;
  }
}
