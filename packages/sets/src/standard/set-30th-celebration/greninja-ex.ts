import {
  AttackEffect,
  CardTag,
  CardType,
  ChoosePokemonPrompt,
  Effect,
  GameMessage,
  PlayerType,
  PokemonCard,
  PokemonSlot,
  PutDamageEffect,
  SlotType,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

function* useStealthySlash(next: Function, store: StoreLike, state: State,
  effect: AttackEffect): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);

  let target: PokemonSlot | undefined;
  yield store.prompt(state, new ChoosePokemonPrompt(
    player.id,
    GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
    PlayerType.TOP_PLAYER,
    [SlotType.ACTIVE, SlotType.BENCH],
    { allowCancel: false }
  ), result => {
    target = result && result.length > 0 ? result[0] : undefined;
    next();
  });

  // The attack's printed damage is blank: all damage comes from the choice.
  effect.damage = 0;
  if (target === undefined) {
    return state;
  }

  const damage = 30 * Math.floor(target.damage / 10);
  if (target === opponent.active) {
    // The Active Pokémon takes the attack's damage the normal way, so
    // Weakness and Resistance apply to it.
    effect.damage = damage;
  } else if (damage > 0) {
    const put = new PutDamageEffect(effect, damage);
    put.target = target;
    store.reduceEffect(state, put);
  }
  return state;
}

// Greninja ex, 30th Celebration 21: a different card from Greninja ex TWM
// (Water, 300 HP, Stealthy Slash / Aqua Edge).
export class GreninjaEx30C extends PokemonCard {
  public tags = [CardTag.POKEMON_EX];

  public stage: Stage = Stage.STAGE_2;

  public evolvesFrom: string = 'Frogadier';

  public cardTypes: CardType[] = [CardType.WATER];

  public hp: number = 300;

  public weakness = [{ type: CardType.LIGHTNING }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Stealthy Slash',
      cost: [CardType.WATER],
      damage: '',
      text: 'This attack does 30 damage to 1 of your opponent\'s Pokémon for each damage counter on that ' +
        'Pokémon. (Don\'t apply Weakness and Resistance for Benched Pokémon.)',
    },
    {
      name: 'Aqua Edge',
      cost: [CardType.WATER, CardType.WATER],
      damage: '160',
      text: '',
    },
  ];

  public set: string = '30C';

  public name: string = 'Greninja ex';

  public fullName: string = 'Greninja ex 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const generator = useStealthySlash(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    return state;
  }
}
