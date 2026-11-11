import {
  AttackEffect,
  ChooseCardsPrompt,
  CardType,
  ConfirmPrompt,
  Effect,
  EnergyCard,
  GameMessage,
  PlayPokemonEffect,
  PokemonCard,
  PowerEffect,
  PowerType,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

export class ChienPao extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.WATER];

  public hp: number = 120;

  public weakness = [{ type: CardType.METAL }];

  public retreat = [CardType.COLORLESS];

  public powers = [
    {
      name: 'Snow Sink',
      powerType: PowerType.ABILITY,
      text: 'When you play this Pokémon from your hand onto your Bench during your turn, you may discard a ' +
        'Stadium in play.',
    },
  ];

  public attacks = [
    {
      name: 'Icicle Loop',
      cost: [CardType.WATER, CardType.WATER, CardType.COLORLESS],
      damage: '120',
      text: 'Put an Energy attached to this Pokémon into your hand.',
    },
  ];

  public set: string = 'SSP';

  public name: string = 'Chien-Pao';

  public fullName: string = 'Chien-Pao SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PlayPokemonEffect && effect.pokemonCard === this
      && effect.target.pokemons.cards.length === 0 && effect.target !== effect.player.active) {
      const player = effect.player;
      if (StateUtils.getStadiumCard(state) === undefined) {
        return state;
      }
      try {
        store.reduceEffect(state, new PowerEffect(player, this.powers[0], this));
      } catch {
        return state;
      }
      return store.prompt(state, new ConfirmPrompt(player.id, GameMessage.WANT_TO_DISCARD_STADIUM), result => {
        if (!result) {
          return;
        }
        for (const owner of state.players) {
          if (owner.stadium.cards.length > 0) {
            owner.stadium.moveTo(owner.discard);
          }
        }
      });
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      const energies = player.active.energies;
      if (energies.cards.length === 0) {
        return state;
      }
      if (energies.cards.length === 1) {
        energies.moveTo(player.hand);
        return state;
      }
      return store.prompt(state, new ChooseCardsPrompt(
        player.id,
        GameMessage.CHOOSE_CARD_TO_HAND,
        energies,
        {},
        { min: 1, max: 1, allowCancel: false }
      ), selected => {
        energies.moveCardsTo((selected || []) as EnergyCard[], player.hand);
      });
    }

    return state;
  }
}
