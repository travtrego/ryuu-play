import {
  AfterDamageEffect,
  AttackEffect,
  CardTag,
  CardType,
  ChoosePokemonPrompt,
  DealDamageEffect,
  Effect,
  GameMessage,
  PlayerType,
  PokemonCard,
  PowerEffect,
  PowerType,
  SlotType,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

export class IronCrownEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX, CardTag.FUTURE];

  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.PSYCHIC];

  public hp: number = 220;

  public weakness = [{ type: CardType.DARK }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public powers = [
    {
      name: 'Cobalt Command',
      powerType: PowerType.ABILITY,
      text: 'Attacks used by your Future Pokémon, except any Iron Crown ex, do 20 more damage to your ' +
        'opponent\'s Active Pokémon (before applying Weakness and Resistance).',
    },
  ];

  public attacks = [
    {
      name: 'Twin Shotels',
      cost: [CardType.PSYCHIC, CardType.COLORLESS, CardType.COLORLESS],
      damage: '',
      text: 'This attack does 50 damage to 2 of your opponent\'s Pokémon. This attack\'s damage isn\'t affected ' +
        'by Weakness or Resistance, or by any effects on those Pokémon.',
    },
  ];

  public set: string = 'TEF';

  public name: string = 'Iron Crown ex';

  public fullName: string = 'Iron Crown ex TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof DealDamageEffect) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);
      const attacker = effect.source.getPokemonCard();
      if (effect.target !== opponent.active || attacker === undefined
        || !attacker.tags.includes(CardTag.FUTURE) || attacker.name === 'Iron Crown ex') {
        return state;
      }
      // Only while this Iron Crown ex is in play on the attacker's side.
      let inPlay = false;
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (slot, card) => {
        if (card === this) {
          inPlay = true;
        }
      });
      if (!inPlay) {
        return state;
      }
      try {
        store.reduceEffect(state, new PowerEffect(player, this.powers[0], this));
      } catch {
        return state;
      }
      effect.damage += 20;
      return state;
    }

    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      // A passive Ability: only checked (see above), never used.
      return state;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);
      let count = 0;
      opponent.forEachPokemon(PlayerType.TOP_PLAYER, () => { count += 1; });
      const amount = Math.min(2, count);
      effect.damage = 0;

      return store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
        PlayerType.TOP_PLAYER,
        [SlotType.ACTIVE, SlotType.BENCH],
        { min: amount, max: amount, allowCancel: false }
      ), targets => {
        for (const target of targets || []) {
          // Placed directly: no Weakness/Resistance and none of the effects on
          // the target (they live on DealDamageEffect / PutDamageEffect). The
          // Tera rule still protects a Benched Tera Pokémon (not verified
          // against an official ruling).
          const card = target.getPokemonCard();
          if (card !== undefined && card.tags.includes(CardTag.TERA) && target !== opponent.active) {
            continue;
          }
          target.damage += 50;
          const after = new AfterDamageEffect(effect, 50);
          after.target = target;
          store.reduceEffect(state, after);
        }
      });
    }

    return state;
  }
}
