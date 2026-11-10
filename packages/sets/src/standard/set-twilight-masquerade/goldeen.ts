import {
  AttackEffect,
  CardType,
  CheckAttackCountEffect,
  ChooseCardsPrompt,
  CoinFlipPrompt,
  DiscardCardsEffect,
  Effect,
  GameMessage,
  PokemonCard,
  PowerEffect,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';
import { applyFestivalLead, festivalLeadPower } from './festival-lead';

export class Goldeen extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.WATER];

  public hp: number = 50;

  public weakness = [{ type: CardType.LIGHTNING }];

  public retreat = [CardType.COLORLESS];

  public powers = [festivalLeadPower()];

  public attacks = [
    {
      name: 'Whirlpool',
      cost: [CardType.COLORLESS, CardType.COLORLESS],
      damage: '10',
      text: 'Flip a coin. If heads, discard an Energy from your opponent\'s Active Pokémon.',
    },
  ];

  public set: string = 'TWM';

  public name: string = 'Goldeen';

  public fullName: string = 'Goldeen TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof CheckAttackCountEffect) {
      applyFestivalLead(store, state, effect, this, this.powers[0]);
      return state;
    }

    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      return state;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      const opponent = effect.opponent;
      return store.prompt(state, new CoinFlipPrompt(player.id, GameMessage.COIN_FLIP), heads => {
        if (!heads || opponent.active.energies.cards.length === 0) {
          return;
        }
        store.prompt(state, new ChooseCardsPrompt(
          player.id,
          GameMessage.CHOOSE_CARD_TO_DISCARD,
          opponent.active.energies,
          {},
          { min: 1, max: 1, allowCancel: false }
        ), selected => {
          const discard = new DiscardCardsEffect(effect, selected || []);
          discard.target = opponent.active;
          store.reduceEffect(state, discard);
        });
      });
    }

    return state;
  }
}
