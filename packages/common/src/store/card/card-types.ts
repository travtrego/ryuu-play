
export enum CardTag {
  POKEMON_SP = 'SP',
  POKEMON_EX = 'EX',
  POKEMON_GX = 'GX',
  POKEMON_LV_X = 'LV_X',
  ACE_SPEC = 'ACE_SPEC',
  FOSSIL = 'FOSSIL',
  // Cards that reference Tera Pokemon need a way to recognise them. No Tera
  // card is implemented yet, so nothing carries this tag today - effects that
  // filter on it correctly find no targets until one does.
  TERA = 'TERA'
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
