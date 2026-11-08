import {
  AttackEffect,
  Card,
  CardTag,
  CardType,
  ChooseCardsPrompt,
  Effect,
  EndTurnEffect,
  GameError,
  GameMessage,
  PokemonCard,
  PowerEffect,
  PowerType,
  PutDamageEffect,
  ShowCardsPrompt,
  ShuffleDeckPrompt,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

import { commonMarkers } from '../../common';

function* useMetallicSignal(next: Function, store: StoreLike, state: State, effect: PowerEffect): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);

  const blocked: number[] = [];
  player.deck.cards.forEach((card, index) => {
    const ok = card instanceof PokemonCard && card.stage !== Stage.BASIC && card.cardTypes.includes(CardType.METAL);
    if (!ok) {
      blocked.push(index);
    }
  });

  let found: Card[] = [];
  yield store.prompt(state, new ChooseCardsPrompt(
    player.id,
    GameMessage.CHOOSE_CARD_TO_HAND,
    player.deck,
    {},
    { min: 0, max: 2, allowCancel: false, blocked }
  ), selected => {
    found = selected || [];
    next();
  });

  player.deck.moveCardsTo(found, player.hand);

  if (found.length > 0) {
    yield store.prompt(state, new ShowCardsPrompt(opponent.id, GameMessage.CARDS_SHOWED_BY_THE_OPPONENT, found),
      () => next());
  }

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

export class GenesectEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX];

  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.METAL];

  public hp: number = 220;

  public weakness = [{ type: CardType.FIRE }];

  public resistance = [{ type: CardType.GRASS, value: -30 }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public powers = [
    {
      name: 'Metallic Signal',
      useWhenInPlay: true,
      powerType: PowerType.ABILITY,
      text: 'Once during your turn, you may search your deck for up to 2 Evolution M Pokémon, reveal them, ' +
        'and put them into your hand. Then, shuffle your deck.',
    },
  ];

  public attacks = [
    {
      name: 'Protect Charge',
      cost: [CardType.METAL, CardType.METAL, CardType.COLORLESS],
      damage: '150',
      text: 'During your opponent\'s next turn, this Pokémon takes 30 less damage from attacks (after applying ' +
        'Weakness and Resistance).',
    },
  ];

  public set: string = 'BLK';

  public name: string = 'Genesect ex';

  public fullName: string = 'Genesect ex BLK';

  public readonly METALLIC_SIGNAL_MARKER = 'METALLIC_SIGNAL_MARKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    const opponentNextTurn = commonMarkers.duringOpponentNextTurn(this, store, state, effect);

    if (effect instanceof PutDamageEffect
      && effect.target.getPokemonCard() === this
      && opponentNextTurn.hasMarker(effect, effect.target)) {
      effect.damage = Math.max(0, effect.damage - 30);
      return state;
    }

    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;
      if (StateUtils.findPokemonSlot(state, this) === undefined || player.deck.cards.length === 0) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      if (player.marker.hasMarker(this.METALLIC_SIGNAL_MARKER, this)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }
      player.marker.addMarker(this.METALLIC_SIGNAL_MARKER, this);
      const generator = useMetallicSignal(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      opponentNextTurn.setMarker(effect, effect.player.active);
      return state;
    }

    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(this.METALLIC_SIGNAL_MARKER, this);
    }

    return state;
  }
}
