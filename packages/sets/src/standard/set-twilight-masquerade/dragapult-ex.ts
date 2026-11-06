import {
  AttackEffect,
  CardTag,
  CardType,
  DamageMap,
  Effect,
  GameMessage,
  PlayerType,
  PokemonCard,
  PutCountersEffect,
  PutDamagePrompt,
  SlotType,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

export class DragapultEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX, CardTag.TERA];

  public stage: Stage = Stage.STAGE_2;

  public evolvesFrom = 'Drakloak';

  public cardTypes: CardType[] = [CardType.DRAGON];

  public hp: number = 320;

  public weakness = [];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    { name: 'Jet Headbutt', cost: [CardType.COLORLESS], damage: '70', text: '' },
    {
      name: 'Phantom Dive',
      cost: [CardType.FIRE, CardType.PSYCHIC],
      damage: '200',
      text: 'Put 6 damage counters on your opponent\'s Benched Pokémon in any way you like.',
    },
  ];

  public set: string = 'TWM';

  public name: string = 'Dragapult ex';

  public fullName: string = 'Dragapult ex TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      const maxAllowedDamage: DamageMap[] = [];
      opponent.forEachPokemon(PlayerType.TOP_PLAYER, (slot, card, target) => {
        if (slot !== opponent.active) {
          maxAllowedDamage.push({ target, damage: 60 });
        }
      });

      if (maxAllowedDamage.length === 0) {
        return state;
      }

      return store.prompt(
        state,
        new PutDamagePrompt(
          player.id,
          GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
          PlayerType.TOP_PLAYER,
          [SlotType.BENCH],
          60,
          maxAllowedDamage,
          { allowCancel: false }
        ),
        targets => {
          const results = targets || [];
          for (const result of results) {
            const target = StateUtils.getTarget(state, player, result.target);
            // Damage counters are an effect of the attack, not damage:
            // they are placed even on a Benched Tera Pokémon.
            const putCounters = new PutCountersEffect(effect, result.damage);
            putCounters.target = target;
            store.reduceEffect(state, putCounters);
          }
        }
      );
    }

    return state;
  }
}
