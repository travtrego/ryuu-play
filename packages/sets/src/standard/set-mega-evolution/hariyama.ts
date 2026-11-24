import {
  AttackEffect,
  CardType,
  ChoosePokemonPrompt,
  ConfirmPrompt,
  DealDamageEffect,
  Effect,
  EvolveEffect,
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

function* useHeaveHoCatcher(next: Function, store: StoreLike, state: State, effect: EvolveEffect,
  self: PokemonCard): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);

  // Only when played from the hand (also through Rare Candy), and only if
  // there is a Benched Pokémon to switch in.
  if (!player.hand.cards.includes(self) || !opponent.bench.some(b => b.pokemons.cards.length > 0)) {
    return state;
  }
  try {
    store.reduceEffect(state, new PowerEffect(player, self.powers[0], self));
  } catch {
    return state;
  }

  let use = false;
  yield store.prompt(state, new ConfirmPrompt(player.id, GameMessage.WANT_TO_USE_ABILITY), result => {
    use = !!result;
    next();
  });
  if (!use) {
    return state;
  }

  return store.prompt(state, new ChoosePokemonPrompt(
    player.id,
    GameMessage.CHOOSE_POKEMON_TO_SWITCH,
    PlayerType.TOP_PLAYER,
    [SlotType.BENCH],
    { allowCancel: false }
  ), result => {
    if (result && result.length > 0) {
      opponent.switchPokemon(result[0]);
    }
  });
}

export class HariyamaMEG extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom = 'Makuhita';

  public cardTypes: CardType[] = [CardType.FIGHTING];

  public hp: number = 150;

  public weakness = [{ type: CardType.PSYCHIC }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS];

  public powers = [
    {
      name: 'Heave-Ho Catcher',
      powerType: PowerType.ABILITY,
      text: 'Once during your turn, when you play this Pokémon from your hand to evolve 1 of your Pokémon, ' +
        'you may use this Ability. Switch in 1 of your opponent\'s Benched Pokémon to the Active Spot.',
    },
  ];

  public attacks = [
    {
      name: 'Wild Press',
      cost: [CardType.FIGHTING, CardType.FIGHTING, CardType.FIGHTING],
      damage: '210',
      text: 'This Pokémon also does 70 damage to itself.',
    },
  ];

  public set: string = 'MEG';

  public name: string = 'Hariyama';

  public fullName: string = 'Hariyama MEG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof EvolveEffect && effect.pokemonCard === this) {
      const generator = useHeaveHoCatcher(() => generator.next(), store, state, effect, this);
      return generator.next().value;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const selfDamage = new DealDamageEffect(effect, 70);
      selfDamage.target = effect.player.active;
      store.reduceEffect(state, selfDamage);
    }

    return state;
  }
}
