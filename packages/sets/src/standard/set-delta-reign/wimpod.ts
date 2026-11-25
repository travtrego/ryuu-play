import {
  CardTag,
  CardType,
  CheckRetreatCostEffect,
  Effect,
  PlayerType,
  PokemonCard,
  PowerEffect,
  PowerType,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

/** Wimpod — Delta Reign 10. */
export class WimpodDLR extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.GRASS];

  public hp: number = 70;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS];

  public powers = [
    {
      name: 'Punk Out',
      powerType: PowerType.ABILITY,
      text: 'If your opponent has any Pokémon ex in play, this Pokémon has no Retreat Cost.',
    },
  ];

  public attacks = [
    { name: 'Ram', cost: [CardType.GRASS], damage: '10', text: '' },
  ];

  public set: string = 'DLR';

  public name: string = 'Wimpod';

  public fullName: string = 'Wimpod DLR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof CheckRetreatCostEffect && effect.player.active.getPokemonCard() === this) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);
      let opponentHasEx = false;
      opponent.forEachPokemon(PlayerType.TOP_PLAYER, (slot, card) => {
        if (card.tags.includes(CardTag.POKEMON_EX)) {
          opponentHasEx = true;
        }
      });
      if (!opponentHasEx) {
        return state;
      }
      // Something (an opponent's Ability lock) may block Punk Out.
      try {
        store.reduceEffect(state, new PowerEffect(player, this.powers[0], this));
      } catch {
        return state;
      }
      effect.cost = [];
      return state;
    }

    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      // A passive Ability: only checked (see above), never used.
      return state;
    }

    return state;
  }
}
