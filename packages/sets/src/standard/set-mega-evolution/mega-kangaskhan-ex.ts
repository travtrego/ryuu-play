import {
  AttackEffect,
  CardTag,
  CardType,
  CoinFlipPrompt,
  Effect,
  EndTurnEffect,
  GameError,
  GameMessage,
  PokemonCard,
  PowerEffect,
  PowerType,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

function* useRapidFireCombo(next: Function, store: StoreLike, state: State,
  effect: AttackEffect): IterableIterator<State> {
  const player = effect.player;
  let heads = 0;
  let flip = false;
  do {
    yield store.prompt(state, new CoinFlipPrompt(player.id, GameMessage.COIN_FLIP), result => {
      flip = result;
      heads += flip ? 1 : 0;
      next();
    });
  } while (flip);
  effect.damage += 50 * heads;
  return state;
}

export class MegaKangaskhanEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX, CardTag.MEGA_EVOLUTION_EX];

  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.COLORLESS];

  public hp: number = 300;

  public weakness = [{ type: CardType.FIGHTING }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS];

  public powers = [
    {
      name: 'Run Errand',
      useWhenInPlay: true,
      powerType: PowerType.ABILITY,
      text: 'Once during your turn, if this Pokémon is in the Active Spot, you may draw 2 cards. ' +
        'You can\'t use more than 1 Run Errand Ability each turn.',
    },
  ];

  public attacks = [
    {
      name: 'Rapid-Fire Combo',
      cost: [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
      damage: '200+',
      text: 'Flip a coin until you get tails. This attack does 50 more damage for each heads.',
    },
  ];

  public set: string = 'MEG';

  public name: string = 'Mega Kangaskhan ex';

  public fullName: string = 'Mega Kangaskhan ex MEG';

  // A player marker, not a card marker: only 1 Run Errand per turn,
  // whichever Mega Kangaskhan ex uses it.
  public static readonly RUN_ERRAND_MARKER = 'RUN_ERRAND_MARKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;
      if (player.active.getPokemonCard() !== this || player.deck.cards.length === 0) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      if (player.marker.hasMarker(MegaKangaskhanEx.RUN_ERRAND_MARKER)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }
      player.marker.addMarker(MegaKangaskhanEx.RUN_ERRAND_MARKER, this);
      player.deck.moveTo(player.hand, 2);
      return state;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const generator = useRapidFireCombo(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(MegaKangaskhanEx.RUN_ERRAND_MARKER);
    }

    return state;
  }
}
