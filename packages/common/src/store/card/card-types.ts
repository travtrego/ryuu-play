
export enum CardTag {
  POKEMON_SP = 'SP',
  POKEMON_EX = 'EX',
  /**
   * Mega Evolution Pokémon ex (Mega Evolution era, 2025+). Always paired with
   * POKEMON_EX: a Mega Evolution Pokémon ex is a Pokémon ex, but gives up 3
   * Prize cards instead of 2.
   */
  MEGA_EVOLUTION_EX = 'MEGA_EVOLUTION_EX',
  POKEMON_GX = 'GX',
  POKEMON_LV_X = 'LV_X',
  ACE_SPEC = 'ACE_SPEC',
  TERA = 'TERA',
  FOSSIL = 'FOSSIL'
}

export enum SuperType {
  NONE,
  POKEMON,
  TRAINER,
  ENERGY,
}

export enum EnergyType {
  BASIC,
  SPECIAL,
}

export enum TrainerType {
  ITEM,
  SUPPORTER,
  STADIUM,
  TOOL,
}

export enum Stage {
  NONE,
  RESTORED,
  BASIC,
  STAGE_1,
  STAGE_2,
}

export enum CardType {
  COLORLESS,
  GRASS,
  FIGHTING,
  PSYCHIC,
  WATER,
  LIGHTNING,
  METAL,
  DARK,
  FIRE,
  DRAGON,
  FAIRY,
}

export enum SpecialCondition {
  PARALYZED,
  CONFUSED,
  ASLEEP,
  POISONED,
  BURNED
}
