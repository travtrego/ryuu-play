import {
  Attack,
  AttackEffect,
  CardList,
  CardTag,
  CardType,
  ChooseAttackPrompt,
  ChooseCardsPrompt,
  Effect,
  EndTurnEffect,
  GameError,
  GameLog,
  GameMessage,
  PokemonCard,
  PowerEffect,
  PowerType,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';
import { isNsPokemon } from './ns-utils';

export class NsZoroarkEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX];

  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom: string = 'N\'s Zorua';

  public cardTypes: CardType[] = [CardType.DARK];

  public hp: number = 280;

  public weakness = [{ type: CardType.GRASS }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public powers = [
    {
      name: 'Trade',
      useWhenInPlay: true,
      powerType: PowerType.ABILITY,
      text: 'You must discard a card from your hand in order to use this Ability. Once during your turn, ' +
        'you may draw 2 cards.',
    },
  ];

  public attacks = [
    {
      name: 'Night Joker',
      cost: [CardType.DARK, CardType.DARK],
      damage: '',
      text: 'Choose 1 of your Benched N\'s Pokémon\'s attacks and use it as this attack.',
    },
  ];

  public set: string = 'JTG';

  public name: string = 'N\'s Zoroark ex';

  public fullName: string = 'N\'s Zoroark ex JTG';

  public readonly TRADE_MARKER = 'TRADE_MARKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;
      if (StateUtils.findPokemonSlot(state, this) === undefined
        || player.hand.cards.length === 0
        || player.deck.cards.length === 0) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      if (player.marker.hasMarker(this.TRADE_MARKER, this)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }
      const hand = new CardList();
      hand.cards = player.hand.cards.slice();
      return store.prompt(state, new ChooseCardsPrompt(
        player.id,
        GameMessage.CHOOSE_CARD_TO_DISCARD,
        hand,
        {},
        { min: 1, max: 1, allowCancel: true }
      ), selected => {
        const cards = selected || [];
        if (cards.length === 0) {
          return;
        }
        player.marker.addMarker(this.TRADE_MARKER, this);
        player.hand.moveCardsTo(cards, player.discard);
        player.deck.moveTo(player.hand, 2);
      });
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      const opponent = effect.opponent;

      const cards: PokemonCard[] = [];
      const blocked: { index: number, name: string }[] = [];
      player.bench.forEach(slot => {
        const card = slot.getPokemonCard();
        if (card === undefined || !isNsPokemon(card) || card.attacks.length === 0) {
          return;
        }
        const index = cards.length;
        cards.push(card);
        // Copying another Night Joker would only ask the same question again.
        card.attacks.filter(a => a.name === 'Night Joker')
          .forEach(a => blocked.push({ index, name: a.name }));
      });

      const usable = cards.some((card, index) => card.attacks.some(a =>
        !blocked.some(b => b.index === index && b.name === a.name)));
      if (!usable) {
        return state;
      }

      return store.prompt(state, new ChooseAttackPrompt(
        player.id,
        GameMessage.CHOOSE_ATTACK_TO_COPY,
        cards,
        { allowCancel: false, blocked }
      ), result => {
        const attack = result as Attack | null;
        if (attack === null || attack === undefined) {
          return;
        }
        store.log(state, GameLog.LOG_PLAYER_COPIES_ATTACK, { name: player.name, attack: attack.name });
        const copied = new AttackEffect(player, opponent, attack);
        store.reduceEffect(state, copied);
        store.waitPrompt(state, () => {
          effect.damage = copied.damage;
        });
      });
    }

    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(this.TRADE_MARKER, this);
    }

    return state;
  }
}
