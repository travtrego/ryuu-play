import {
  AttackEffect,
  Card,
  CardTag,
  CardType,
  ChooseCardsPrompt,
  ChoosePokemonPrompt,
  DiscardCardsEffect,
  Effect,
  GameMessage,
  PlayerType,
  PokemonCard,
  PokemonSlot,
  PutDamageEffect,
  ShuffleDeckPrompt,
  SlotType,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

function* useShinobiBlade(next: Function, store: StoreLike, state: State, effect: AttackEffect): IterableIterator<State> {
  const player = effect.player;
  if (player.deck.cards.length === 0) {
    return state;
  }

  let cards: Card[] = [];
  yield store.prompt(state, new ChooseCardsPrompt(
    player.id,
    GameMessage.CHOOSE_CARD_TO_HAND,
    player.deck,
    {},
    { min: 0, max: 1, allowCancel: true }
  ), selected => {
    cards = selected || [];
    next();
  });

  player.deck.moveCardsTo(cards, player.hand);

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

function* useMirageBarrage(next: Function, store: StoreLike, state: State, effect: AttackEffect): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);

  // "Discard 2 Energy": 2 Energy cards (an Ignition Energy is one card).
  const energies = player.active.energies.cards.length;
  const toDiscard = Math.min(2, energies);
  if (toDiscard > 0) {
    let cards: Card[] = [];
    yield store.prompt(state, new ChooseCardsPrompt(
      player.id,
      GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
      player.active.energies,
      {},
      { min: toDiscard, max: toDiscard, allowCancel: false }
    ), selected => {
      cards = selected || [];
      next();
    });
    const discardEnergy = new DiscardCardsEffect(effect, cards);
    discardEnergy.target = player.active;
    store.reduceEffect(state, discardEnergy);
  }

  let inPlay = 0;
  opponent.forEachPokemon(PlayerType.TOP_PLAYER, () => { inPlay += 1; });
  const count = Math.min(2, inPlay);

  let targets: PokemonSlot[] = [];
  yield store.prompt(state, new ChoosePokemonPrompt(
    player.id,
    GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
    PlayerType.TOP_PLAYER,
    [SlotType.ACTIVE, SlotType.BENCH],
    { min: count, max: count, allowCancel: false }
  ), selected => {
    targets = selected || [];
    next();
  });

  for (const target of targets) {
    if (target === opponent.active) {
      // The Active Pokémon takes the attack's damage the normal way, so
      // Weakness and Resistance apply to it.
      effect.damage = 120;
    } else {
      const damage = new PutDamageEffect(effect, 120);
      damage.target = target;
      store.reduceEffect(state, damage);
    }
  }

  return state;
}

export class GreninjaEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX, CardTag.TERA];

  public stage: Stage = Stage.STAGE_2;

  public evolvesFrom: string = 'Frogadier';

  public cardTypes: CardType[] = [CardType.FIGHTING];

  public hp: number = 310;

  public weakness = [{ type: CardType.PSYCHIC }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Shinobi Blade',
      cost: [CardType.WATER],
      damage: '170',
      text: 'You may search your deck for a card and put it into your hand. Then, shuffle your deck.',
    },
    {
      name: 'Mirage Barrage',
      cost: [CardType.WATER, CardType.COLORLESS, CardType.COLORLESS],
      damage: '',
      text: 'Discard 2 Energy from this Pokémon. This attack does 120 damage to 2 of your opponent\'s Pokémon. ' +
        '(Don\'t apply Weakness and Resistance for Benched Pokémon.)',
    },
  ];

  public set: string = 'TWM';

  public name: string = 'Greninja ex';

  public fullName: string = 'Greninja ex TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const generator = useShinobiBlade(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      const generator = useMirageBarrage(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    return state;
  }
}
