import {
  AttackEffect,
  CardTag,
  CardType,
  CheckAttackCostEffect,
  CheckProvidedEnergyEffect,
  Effect,
  PokemonCard,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

export class MegaExcadrillEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX, CardTag.MEGA_EVOLUTION_EX];

  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom = 'Drilbur';

  public cardTypes: CardType[] = [CardType.METAL];

  public hp: number = 340;

  public weakness = [{ type: CardType.FIRE }];

  public resistance = [{ type: CardType.GRASS, value: -30 }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Undermine',
      cost: [CardType.METAL, CardType.METAL],
      damage: '90',
      text: 'Discard the top 2 cards of your opponent\'s deck.',
    },
    {
      name: 'Maximum Drilling',
      cost: [CardType.METAL, CardType.METAL, CardType.METAL],
      damage: '200+',
      text: 'If this Pokémon has at least 2 extra Energy attached (in addition to this attack\'s cost), ' +
        'this attack does 130 more damage.',
    },
  ];

  public set: string = 'PBL';

  public name: string = 'Mega Excadrill ex';

  public fullName: string = 'Mega Excadrill ex PBL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const opponent = StateUtils.getOpponent(state, effect.player);
      // An effect on the opponent's deck, not on their Active Pokémon, so
      // "prevent all effects of attacks done to this Pokémon" does not stop it.
      opponent.deck.moveTo(opponent.discard, 2);
      return state;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      const player = effect.player;
      const checkCost = new CheckAttackCostEffect(player, effect.attack);
      store.reduceEffect(state, checkCost);
      const checkEnergy = new CheckProvidedEnergyEffect(player);
      store.reduceEffect(state, checkEnergy);
      const extra = StateUtils.countAdditionalEnergy(checkEnergy.energyMap, checkCost.cost);
      if (extra >= 2) {
        effect.damage += 130;
      }
    }

    return state;
  }
}
