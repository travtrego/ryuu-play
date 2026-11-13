import {
  AttackEffect,
  CardType,
  ChoosePokemonPrompt,
  DealDamageEffect,
  Effect,
  GameMessage,
  PlayerType,
  PokemonCard,
  SlotType,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

export class BayleefMEG extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom: string = 'Chikorita';

  public cardTypes: CardType[] = [CardType.GRASS];

  public hp: number = 110;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Push Down',
      cost: [CardType.GRASS, CardType.COLORLESS],
      damage: '50',
      text: 'Switch out your opponent\'s Active Pokémon to the Bench. (Your opponent chooses the new Active ' +
        'Pokémon.)',
    },
  ];

  public set: string = 'MEG';

  public name: string = 'Bayleef';

  public fullName: string = 'Bayleef MEG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const opponent = effect.opponent;
      // Deal the damage first, to the Pokémon that is Active now, then switch.
      const damage = new DealDamageEffect(effect, effect.damage);
      effect.damage = 0;
      store.reduceEffect(state, damage);

      if (!opponent.bench.some(b => b.pokemons.cards.length > 0)) {
        return state;
      }
      return store.prompt(state, new ChoosePokemonPrompt(
        opponent.id,
        GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.BENCH],
        { allowCancel: false }
      ), targets => {
        if (targets && targets.length > 0) {
          opponent.switchPokemon(targets[0]);
        }
      });
    }
    return state;
  }
}
