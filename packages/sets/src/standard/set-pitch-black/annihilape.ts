import {
  AfterDamageEffect,
  AttackEffect,
  CardType,
  CheckHpEffect,
  ChoosePokemonPrompt,
  CoinFlipPrompt,
  Effect,
  GameMessage,
  PlayerType,
  PokemonCard,
  PowerEffect,
  PowerType,
  PutCountersEffect,
  SlotType,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

export class Annihilape extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;

  public evolvesFrom: string = 'Primeape';

  public cardTypes: CardType[] = [CardType.PSYCHIC];

  public hp: number = 150;

  public weakness = [{ type: CardType.DARK }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public powers = [
    {
      name: 'Durable Body',
      powerType: PowerType.ABILITY,
      text: 'If this Pokémon would be Knocked Out by damage from an attack, flip a coin. If heads, this ' +
        'Pokémon is not Knocked Out, and its remaining HP becomes 10.',
    },
  ];

  public attacks = [
    {
      name: 'Ghostly Blow',
      cost: [CardType.PSYCHIC, CardType.PSYCHIC],
      damage: '100',
      text: 'Place 5 damage counters on 1 of your opponent\'s Benched Pokémon.',
    },
  ];

  public set: string = 'PBL';

  public name: string = 'Annihilape';

  public fullName: string = 'Annihilape PBL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AfterDamageEffect && effect.target.getPokemonCard() === this) {
      const target = effect.target;
      const owner = StateUtils.findOwner(state, target);
      const checkHp = new CheckHpEffect(owner, target);
      store.reduceEffect(state, checkHp);
      if (target.damage < checkHp.hp) {
        return state;
      }
      try {
        store.reduceEffect(state, new PowerEffect(owner, this.powers[0], this));
      } catch {
        return state;
      }
      return store.prompt(state, new CoinFlipPrompt(owner.id, GameMessage.COIN_FLIP), heads => {
        // Still this Pokémon, still at 0 HP or less: stays in play with 10 HP.
        if (heads && target.getPokemonCard() === this && target.damage >= checkHp.hp) {
          target.damage = checkHp.hp - 10;
        }
      });
    }

    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      // A passive Ability: only checked (see above), never used.
      return state;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      const opponent = effect.opponent;
      if (!opponent.bench.some(b => b.pokemons.cards.length > 0)) {
        return state;
      }
      return store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
        PlayerType.TOP_PLAYER,
        [SlotType.BENCH],
        { min: 1, max: 1, allowCancel: false }
      ), selected => {
        for (const target of selected || []) {
          const counters = new PutCountersEffect(effect, 50);
          counters.target = target;
          store.reduceEffect(state, counters);
        }
      });
    }

    return state;
  }
}
