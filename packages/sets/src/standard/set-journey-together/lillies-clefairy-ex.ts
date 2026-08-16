import {
  AttackEffect,
  CardTag,
  CardType,
  CheckPokemonStatsEffect,
  Effect,
  PokemonCard,
  PowerType,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

export class LilliesClefairyEx extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.PSYCHIC];

  public hp: number = 190;

  public tags = [CardTag.POKEMON_EX];

  public weakness = [{ type: CardType.METAL }];

  public retreat = [CardType.COLORLESS];

  public powers = [
    {
      name: 'Fairy Zone',
      powerType: PowerType.ABILITY,
      text: 'The Weakness of each of your opponent\'s Dragon Pokémon in play is now Psychic. (Apply Weakness as ×2.)',
    },
  ];

  public attacks = [
    {
      name: 'Full Moon Rondo',
      cost: [CardType.PSYCHIC, CardType.COLORLESS],
      damage: '20+',
      text: 'This attack does 20 more damage for each Benched Pokémon (both yours and your opponent\'s).',
    },
  ];

  public set: string = 'JTG';

  public name: string = 'Lillie\'s Clefairy ex';

  public fullName: string = 'Lillie\'s Clefairy ex JTG';

  private findOwnerWhileInPlay(state: State) {
    return state.players.find(player =>
      player.active.getPokemonCard() === this
      || player.bench.some(slot => slot.getPokemonCard() === this)
    );
  }

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof CheckPokemonStatsEffect) {
      const owner = this.findOwnerWhileInPlay(state);
      const targetCard = effect.target.getPokemonCard();

      if (owner !== undefined
          && targetCard !== undefined
          && targetCard.cardTypes.includes(CardType.DRAGON)
          && StateUtils.findOwner(state, effect.target) !== owner) {
        effect.weakness = [{ type: CardType.PSYCHIC }];
      }
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const occupiedBenchSlots = [...effect.player.bench, ...effect.opponent.bench]
        .filter(slot => slot.getPokemonCard() !== undefined)
        .length;
      effect.damage = 20 + (20 * occupiedBenchSlots);
    }

    return state;
  }
}
