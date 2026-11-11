import {
  AttackEffect,
  Card,
  CardList,
  CardTag,
  CardType,
  ChooseCardsPrompt,
  Effect,
  EnergyCard,
  EnergyType,
  GameMessage,
  PlayerType,
  PokemonCard,
  PokemonSlot,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

export class RagingBoltEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX, CardTag.ANCIENT];

  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.DRAGON];

  public hp: number = 240;

  public weakness = [];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Burst Roar',
      cost: [CardType.COLORLESS],
      damage: '',
      text: 'Discard your hand and draw 6 cards.',
    },
    {
      name: 'Bellowing Thunder',
      cost: [CardType.LIGHTNING, CardType.FIGHTING],
      damage: '70×',
      text: 'You may discard any amount of Basic Energy from your Pokémon. This attack does 70 damage for each ' +
        'card you discarded in this way.',
    },
  ];

  public set: string = 'TEF';

  public name: string = 'Raging Bolt ex';

  public fullName: string = 'Raging Bolt ex TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      player.hand.moveTo(player.discard);
      player.deck.moveTo(player.hand, 6);
      return state;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      const player = effect.player;
      effect.damage = 0;

      // Every Basic Energy card attached to any of your Pokémon, in one list.
      const owners = new Map<Card, PokemonSlot>();
      const pool = new CardList();
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, slot => {
        for (const card of slot.energies.cards) {
          if (card instanceof EnergyCard && card.energyType === EnergyType.BASIC) {
            owners.set(card, slot);
            pool.cards.push(card);
          }
        }
      });
      if (pool.cards.length === 0) {
        return state;
      }
      pool.isPublic = true;

      return store.prompt(state, new ChooseCardsPrompt(
        player.id,
        GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
        pool,
        {},
        { min: 0, max: pool.cards.length, allowCancel: false }
      ), selected => {
        const cards = selected || [];
        for (const card of cards) {
          owners.get(card)?.moveCardTo(card, player.discard);
        }
        effect.damage = 70 * cards.length;
      });
    }

    return state;
  }
}
