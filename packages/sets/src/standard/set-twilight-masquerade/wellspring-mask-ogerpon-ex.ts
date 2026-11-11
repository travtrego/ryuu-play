import {
  AttackEffect,
  Card,
  CardTag,
  CardType,
  ChooseCardsPrompt,
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
import { commonAttacks } from '../../common';

function* useTorrentialPump(
  next: Function,
  store: StoreLike,
  state: State,
  effect: AttackEffect
): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);
  const hasBench = opponent.bench.some(b => b.pokemons.cards.length > 0);

  // Shuffling Energy away does nothing without a Benched Pokémon to hit.
  if (!hasBench || player.active.energies.cards.length < 3) {
    return state;
  }

  let cards: Card[] = [];
  yield store.prompt(state, new ChooseCardsPrompt(
    player.id,
    GameMessage.CHOOSE_CARD_TO_DECK,
    player.active.energies,
    {},
    { min: 3, max: 3, allowCancel: true }
  ), selected => {
    cards = selected || [];
    next();
  });

  if (cards.length !== 3) {
    return state;
  }

  player.active.moveCardsTo(cards, player.deck);

  yield store.prompt(state, new ChoosePokemonPrompt(
    player.id,
    GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
    PlayerType.TOP_PLAYER,
    [SlotType.BENCH],
    { min: 1, max: 1, allowCancel: false }
  ), targets => {
    for (const target of targets || []) {
      // Damage to the Bench: Weakness and Resistance don't apply.
      const damage = new PutDamageEffect(effect, 120);
      damage.target = target;
      store.reduceEffect(state, damage);
    }
    next();
  });

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

export class WellspringMaskOgerponEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX, CardTag.TERA];

  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.WATER];

  public hp: number = 210;

  public weakness = [{ type: CardType.LIGHTNING }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Sob',
      cost: [CardType.COLORLESS],
      damage: '20',
      text: 'During your opponent\'s next turn, the Defending Pokémon can\'t retreat.',
    },
    {
      name: 'Torrential Pump',
      cost: [CardType.WATER, CardType.COLORLESS, CardType.COLORLESS],
      damage: '100',
      text: 'You may shuffle 3 Energy attached to this Pokémon into your deck. If you do, this attack also ' +
        'does 120 damage to 1 of your opponent\'s Benched Pokémon. (Don\'t apply Weakness and Resistance for ' +
        'Benched Pokémon.)',
    },
  ];

  public set: string = 'TWM';

  public name: string = 'Wellspring Mask Ogerpon ex';

  public fullName: string = 'Wellspring Mask Ogerpon ex TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    const cantRetreat = commonAttacks.cantRetreat(this, store, state, effect);

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      return cantRetreat.use(effect);
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      const generator = useTorrentialPump(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    return state;
  }
}
