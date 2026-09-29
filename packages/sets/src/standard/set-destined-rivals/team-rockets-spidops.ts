import {
  AttackEffect,
  Card,
  CardType,
  ChooseCardsPrompt,
  Effect,
  EndTurnEffect,
  EnergyCard,
  EnergyType,
  GameError,
  GameMessage,
  PlayPokemonEffect,
  PokemonCard,
  PowerEffect,
  PowerType,
  Stage,
  State,
  StateUtils,
  StoreLike,
  SuperType,
} from '@ptcg/common';
import { isTeamRocketsPokemon } from './team-rocket-utils';

export class TeamRocketsSpidops extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom = 'Team Rocket\'s Tarountula';

  public cardTypes: CardType[] = [CardType.GRASS];

  public hp: number = 130;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public powers = [
    {
      name: 'Charge Up',
      useWhenInPlay: true,
      powerType: PowerType.ABILITY,
      text: 'Once during your turn, you may attach a Basic Energy from your discard pile to this Pokémon.',
    },
  ];

  public attacks = [
    {
      name: 'Rocket Rush',
      cost: [CardType.GRASS, CardType.COLORLESS],
      damage: '30×',
      text: 'This attack does 30 damage for each of your Team Rocket\'s Pokémon in play.',
    },
  ];

  public set: string = 'DRI';

  public name: string = 'Team Rocket\'s Spidops';

  public fullName: string = 'Team Rocket\'s Spidops DRI';

  public readonly CHARGE_UP_MARKER = 'CHARGE_UP_MARKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PlayPokemonEffect && effect.pokemonCard === this) {
      effect.player.marker.removeMarker(this.CHARGE_UP_MARKER, this);
    }

    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;
      const target = StateUtils.findPokemonSlot(state, this);
      const hasBasicEnergy = player.discard.cards.some(card =>
        card instanceof EnergyCard && card.energyType === EnergyType.BASIC
      );

      if (target === undefined || !hasBasicEnergy) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }

      if (player.marker.hasMarker(this.CHARGE_UP_MARKER, this)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }

      return store.prompt(
        state,
        new ChooseCardsPrompt(
          player.id,
          GameMessage.CHOOSE_CARD_TO_HAND,
          player.discard,
          { superType: SuperType.ENERGY, energyType: EnergyType.BASIC },
          { min: 0, max: 1, allowCancel: true }
        ),
        selected => {
          const cards: Card[] = selected || [];
          if (cards.length > 0) {
            player.discard.moveCardsTo(cards, target.energies);
            player.marker.addMarker(this.CHARGE_UP_MARKER, this);
          }
        }
      );
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const pokemonInPlay = [effect.player.active, ...effect.player.bench]
        .filter(slot => slot.pokemons.cards.length > 0)
        .map(slot => slot.getPokemonCard());
      const teamRocketCount = pokemonInPlay.filter(card => isTeamRocketsPokemon(card)).length;
      effect.damage = 30 * teamRocketCount;
    }

    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(this.CHARGE_UP_MARKER, this);
    }

    return state;
  }
}
