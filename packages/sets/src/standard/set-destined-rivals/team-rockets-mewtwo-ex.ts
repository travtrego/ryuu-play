import {
  AttackEffect,
  Card,
  CardList,
  CardTag,
  CardType,
  ChooseCardsPrompt,
  Effect,
  GameError,
  GameMessage,
  PokemonCard,
  PowerType,
  Stage,
  State,
  StateUtils,
  StoreLike,
  UseAttackEffect,
} from '@ptcg/common';
import { isTeamRocketsPokemon } from './team-rocket-utils';

export class TeamRocketsMewtwoEx extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.PSYCHIC];

  public hp: number = 280;

  public tags = [CardTag.POKEMON_EX];

  public weakness = [{ type: CardType.DARK }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS];

  public powers = [
    {
      name: 'Power Saver',
      powerType: PowerType.ABILITY,
      text: 'This Pokémon can\'t attack unless you have 4 or more Team Rocket\'s Pokémon in play.',
    },
  ];

  public attacks = [
    {
      name: 'Erasure Ball',
      cost: [CardType.PSYCHIC, CardType.PSYCHIC, CardType.COLORLESS],
      damage: '160+',
      text: 'You may discard up to 2 Energy from your Benched Pokémon. ' +
        'This attack does 60 more damage for each card you discarded in this way.',
    },
  ];

  public set: string = 'DRI';

  public name: string = 'Team Rocket\'s Mewtwo ex';

  public fullName: string = 'Team Rocket\'s Mewtwo ex DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof UseAttackEffect
        && effect.attack === this.attacks[0]
        && effect.player.active.getPokemonCard() === this) {
      const teamRocketCount = [effect.player.active, ...effect.player.bench]
        .filter(slot => slot.pokemons.cards.length > 0)
        .map(slot => slot.getPokemonCard())
        .filter(card => isTeamRocketsPokemon(card))
        .length;

      if (teamRocketCount < 4) {
        throw new GameError(GameMessage.BLOCKED_BY_ABILITY);
      }
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      const benchEnergy = new CardList();
      benchEnergy.cards = player.bench.reduce<Card[]>((cards, slot) => {
        cards.push(...slot.energies.cards);
        return cards;
      }, []);

      if (benchEnergy.cards.length === 0) {
        return state;
      }

      return store.prompt(
        state,
        new ChooseCardsPrompt(
          player.id,
          GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
          benchEnergy,
          {},
          { min: 0, max: Math.min(2, benchEnergy.cards.length), allowCancel: true }
        ),
        selected => {
          const cards = selected || [];
          cards.forEach(card => {
            StateUtils.findCardList(state, card).moveCardTo(card, player.discard);
          });
          effect.damage = 160 + (60 * cards.length);
        }
      );
    }

    return state;
  }
}
