import {
  CardType,
  CheckProvidedEnergyEffect,
  Effect,
  EnergyCard,
  EnergyType,
  PokemonCard,
  PowerEffect,
  PowerType,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

export class MeganiumMEG extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;

  public evolvesFrom: string = 'Bayleef';

  public cardTypes: CardType[] = [CardType.GRASS];

  public hp: number = 160;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public powers = [
    {
      name: 'Wild Growth',
      powerType: PowerType.ABILITY,
      text: 'Each Basic G Energy attached to all of your Pokémon provides GG Energy. The effect of Wild Growth ' +
        'doesn\'t stack.',
    },
  ];

  public attacks = [
    {
      name: 'Solar Beam',
      cost: [CardType.GRASS, CardType.GRASS, CardType.COLORLESS, CardType.COLORLESS],
      damage: '140',
      text: '',
    },
  ];

  public set: string = 'MEG';

  public name: string = 'Meganium';

  public fullName: string = 'Meganium MEG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof CheckProvidedEnergyEffect) {
      const slot = StateUtils.findPokemonSlot(state, this);
      if (slot === undefined || slot.getPokemonCard() !== this) {
        return state;
      }
      const owner = StateUtils.findOwner(state, slot);
      if (StateUtils.findOwner(state, effect.source) !== owner) {
        return state;
      }
      const grass = effect.energyMap.filter(item => isBasicGrassEnergy(item.card));
      if (grass.length === 0) {
        return state;
      }
      // A passive Ability: it does nothing while Abilities are blocked.
      try {
        store.reduceEffect(state, new PowerEffect(owner, this.powers[0], this));
      } catch {
        return state;
      }
      // "Doesn't stack": a second Meganium sets the same amount again.
      grass.forEach(item => {
        item.provides = [CardType.GRASS];
        item.provideAmount = 2;
      });
      return state;
    }

    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      // Only checked, never used.
      return state;
    }

    return state;
  }
}

function isBasicGrassEnergy(card: unknown): boolean {
  return card instanceof EnergyCard
    && card.energyType === EnergyType.BASIC
    && card.provides.includes(CardType.GRASS);
}
