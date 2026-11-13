import {
  CardType,
  ChooseCardsPrompt,
  Effect,
  EndTurnEffect,
  GameError,
  GameMessage,
  PlayerType,
  PokemonCard,
  PowerEffect,
  PowerType,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';
import { isBasicFightingEnergy } from './mega-lucario-ex';

/** Shared by every Lunatone with Lunar Cycle: only 1 Lunar Cycle a turn. */
const LUNAR_CYCLE_MARKER = 'LUNAR_CYCLE_MARKER';

export class LunatoneMEG extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.FIGHTING];

  public hp: number = 110;

  public weakness = [{ type: CardType.GRASS }];

  public retreat = [CardType.COLORLESS];

  public powers = [
    {
      name: 'Lunar Cycle',
      powerType: PowerType.ABILITY,
      useWhenInPlay: true,
      text: 'Once during your turn, if you have Solrock in play, you may discard a Basic F Energy card from your ' +
        'hand in order to use this Ability. Draw 3 cards. You can\'t use more than 1 Lunar Cycle Ability each turn.',
    },
  ];

  public attacks = [
    {
      name: 'Power Gem',
      cost: [CardType.FIGHTING, CardType.FIGHTING],
      damage: '50',
      text: '',
    },
  ];

  public set: string = 'MEG';

  public name: string = 'Lunatone';

  public fullName: string = 'Lunatone MEG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;
      const slot = StateUtils.findPokemonSlot(state, this);
      if (slot === undefined || slot.getPokemonCard() !== this) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      if (player.marker.hasMarker(LUNAR_CYCLE_MARKER)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }
      let hasSolrock = false;
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (_slot, card) => {
        if (card.name === 'Solrock') {
          hasSolrock = true;
        }
      });
      if (!hasSolrock || !player.hand.cards.some(c => isBasicFightingEnergy(c))) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      const blocked: number[] = [];
      player.hand.cards.forEach((c, index) => {
        if (!isBasicFightingEnergy(c)) {
          blocked.push(index);
        }
      });
      return store.prompt(state, new ChooseCardsPrompt(
        player.id,
        GameMessage.CHOOSE_CARD_TO_DISCARD,
        player.hand,
        {},
        { min: 1, max: 1, allowCancel: true, blocked }
      ), selected => {
        const cards = selected || [];
        if (cards.length === 0) {
          return;
        }
        player.marker.addMarker(LUNAR_CYCLE_MARKER, this);
        player.hand.moveCardsTo(cards, player.discard);
        player.deck.moveTo(player.hand, 3);
      });
    }

    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(LUNAR_CYCLE_MARKER);
    }

    return state;
  }
}
