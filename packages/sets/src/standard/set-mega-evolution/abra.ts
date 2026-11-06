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

export class Abra extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.PSYCHIC];

  public hp: number = 50;

  public weakness = [{ type: CardType.DARK }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Teleportation Attack',
      cost: [CardType.PSYCHIC],
      damage: '10',
      text: 'Switch this Pokémon with 1 of your Benched Pokémon.',
    },
  ];

  public set: string = 'MEG';

  public name: string = 'Abra';

  public fullName: string = 'Abra MEG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      // Deal the damage first, from Abra, then switch.
      const damage = new DealDamageEffect(effect, effect.damage);
      effect.damage = 0;
      store.reduceEffect(state, damage);

      if (!player.bench.some(b => b.pokemons.cards.length > 0)) {
        return state;
      }
      return store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_SWITCH,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.BENCH],
        { allowCancel: false }
      ), targets => {
        if (targets && targets.length > 0) {
          player.switchPokemon(targets[0]);
        }
      });
    }
    return state;
  }
}
