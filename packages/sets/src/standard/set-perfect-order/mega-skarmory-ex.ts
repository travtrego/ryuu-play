import {
  AttackEffect,
  CardTag,
  CardType,
  ChoosePokemonPrompt,
  Effect,
  GameMessage,
  PlayerType,
  PokemonCard,
  PutDamageEffect,
  ShuffleDeckPrompt,
  SlotType,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

function useSonicRipper(store: StoreLike, state: State, effect: AttackEffect): State {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);

  // The target is chosen first and the deck shuffled last: the engine deals
  // an attack's damage once its first chain of prompts is answered, so the
  // damage must be set in the same callback. The outcome is the card's:
  // all Energy goes into the deck and 220 damage is done to 1 Pokémon
  // (Fezandipiti ex's Cruel Arrow pattern: the Active takes normal attack
  // damage with Weakness and Resistance, a Benched Pokémon without them).
  effect.damage = 0;
  return store.prompt(state, new ChoosePokemonPrompt(
    player.id,
    GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
    PlayerType.TOP_PLAYER,
    [SlotType.ACTIVE, SlotType.BENCH],
    { allowCancel: false }
  ), targets => {
    player.active.energies.moveTo(player.deck);
    const target = targets && targets.length > 0 ? targets[0] : opponent.active;
    if (target === opponent.active) {
      effect.damage = 220;
    } else {
      const damage = new PutDamageEffect(effect, 220);
      damage.target = target;
      store.reduceEffect(state, damage);
    }
    store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
      player.deck.applyOrder(order);
    });
  });
}

export class MegaSkarmoryEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX, CardTag.MEGA_EVOLUTION_EX];

  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.METAL];

  public hp: number = 260;

  public weakness = [{ type: CardType.LIGHTNING }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [];

  public attacks = [
    {
      name: 'Sonic Ripper',
      cost: [CardType.METAL, CardType.METAL, CardType.COLORLESS],
      damage: '',
      text: 'Shuffle all Energy attached to this Pokémon into your deck, and this attack does 220 damage to 1 of ' +
        'your opponent\'s Pokémon. (Don\'t apply Weakness and Resistance for Benched Pokémon.)',
    },
  ];

  public set: string = 'POR';

  public name: string = 'Mega Skarmory ex';

  public fullName: string = 'Mega Skarmory ex POR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      return useSonicRipper(store, state, effect);
    }
    return state;
  }
}
