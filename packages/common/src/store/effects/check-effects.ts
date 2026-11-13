import { CardType } from '../card/card-types';
import { Effect } from './effect';
import { Player } from '../state/player';
import { Resistance, Weakness, Attack } from '../card/pokemon-types';
import { EnergyMap } from '../prompts/choose-energy-prompt';
import { PokemonSlot } from '../state/pokemon-slot';
import { PokemonCard } from '../card/pokemon-card';

export enum CheckEffects {
  CHECK_HP_EFFECT = 'CHECK_HP_EFFECT',
  CHECK_PRIZES_COUNT_EFFECT = 'CHECK_PRIZE_COUNT_EFFECT',
  CHECK_POKEMON_STATS_EFFECT = 'CHECK_POKEMON_STATS_EFFECT',
  CHECK_POKEMON_TYPE_EFFECT = 'CHECK_POKEMON_TYPE_EFFECT',
  CHECK_RETREAT_COST_EFFECT = 'CHECK_RETREAT_COST_EFFECT',
  CHECK_ATTACK_COST_EFFECT = 'CHECK_ATTACK_COST_EFFECT',
  CHECK_ENOUGH_ENERGY_EFFECT = 'CHECK_ENOUGH_ENERGY_EFFECT',
  AFTER_CHECK_ENOUGH_ENERGY_EFFECT = 'AFTER_CHECK_ENOUGH_ENERGY_EFFECT',
  CHECK_POKEMON_PLAYED_TURN_EFFECT = 'CHECK_POKEMON_PLAYED_TURN_EFFECT',
  CHECK_TABLE_STATE_EFFECT = 'CHECK_TABLE_STATE_EFFECT',
  CHECK_ATTACK_COUNT_EFFECT = 'CHECK_ATTACK_COUNT_EFFECT'
}

export class CheckHpEffect implements Effect {
  readonly type: string = CheckEffects.CHECK_HP_EFFECT;
  public preventDefault = false;
  public player: Player;
  public target: PokemonSlot;
  public hp: number;

  constructor(player: Player, target: PokemonSlot) {
    this.player = player;
    this.target = target;
    const pokemonCard = target.getPokemonCard();
    this.hp = pokemonCard ? pokemonCard.hp : 0;
  }
}

export class CheckPokemonPlayedTurnEffect implements Effect {
  readonly type: string = CheckEffects.CHECK_POKEMON_PLAYED_TURN_EFFECT;
  public preventDefault = false;
  public player: Player;
  public target: PokemonSlot;
  public pokemonPlayedTurn: number;
  /**
   * The card the Pokémon is about to evolve into, when the check is made for
   * a normal evolution from the hand (Forest of Vitality looks at its type).
   * Unset for other checks, such as Rare Candy.
   */
  public evolvesInto?: PokemonCard;

  constructor(player: Player, target: PokemonSlot, evolvesInto?: PokemonCard) {
    this.player = player;
    this.target = target;
    this.pokemonPlayedTurn = target.pokemonPlayedTurn;
    this.evolvesInto = evolvesInto;
  }
}

export class CheckPokemonStatsEffect implements Effect {
  readonly type: string = CheckEffects.CHECK_POKEMON_STATS_EFFECT;
  public preventDefault = false;
  public target: PokemonSlot;
  public weakness: Weakness[];
  public resistance: Resistance[];

  constructor(target: PokemonSlot) {
    this.target = target;
    const pokemonCard = target.getPokemonCard();
    this.weakness = pokemonCard ? [ ...pokemonCard.weakness ] : [];
    this.resistance = pokemonCard ? [ ...pokemonCard.resistance ] : [];
  }
}

export class CheckPokemonTypeEffect implements Effect {
  readonly type: string = CheckEffects.CHECK_POKEMON_TYPE_EFFECT;
  public preventDefault = false;
  public target: PokemonSlot;
  public cardTypes: CardType[];

  constructor(target: PokemonSlot) {
    this.target = target;
    const pokemonCard = target.getPokemonCard();
    this.cardTypes = pokemonCard ? pokemonCard.cardTypes : [];
  }
}

export class CheckRetreatCostEffect implements Effect {
  readonly type: string = CheckEffects.CHECK_RETREAT_COST_EFFECT;
  public preventDefault = false;
  public player: Player;
  public cost: CardType[];

  constructor(player: Player) {
    this.player = player;
    const pokemonCard = player.active.getPokemonCard();
    this.cost = pokemonCard !== undefined ? [ ...pokemonCard.retreat ] : [];
  }
}

export class CheckAttackCostEffect implements Effect {
  readonly type: string = CheckEffects.CHECK_ATTACK_COST_EFFECT;
  public preventDefault = false;
  public player: Player;
  public attack: Attack;
  public cost: CardType[];

  constructor(player: Player, attack: Attack) {
    this.player = player;
    this.attack = attack;
    this.cost = [ ...attack.cost ];
  }
}

export class CheckProvidedEnergyEffect implements Effect {
  readonly type: string = CheckEffects.CHECK_ENOUGH_ENERGY_EFFECT;
  public preventDefault = false;
  public player: Player;
  public source: PokemonSlot;
  public energyMap: EnergyMap[] = [];

  constructor(player: Player, source?: PokemonSlot) {
    this.player = player;
    this.source = source === undefined ? player.active : source;
    this.source.energies.cards.forEach(c => {
      this.energyMap.push({ card: c, provides: c.provides, provideAmount: c.provideAmount });
    });
  }
}

export class AfterCheckProvidedEnergyEffect implements Effect {
  readonly type: string = CheckEffects.AFTER_CHECK_ENOUGH_ENERGY_EFFECT;
  public preventDefault = false;
  public player: Player;
  public source: PokemonSlot;
  public energyMap: EnergyMap[] = [];

  constructor(base: CheckProvidedEnergyEffect) {
    this.player = base.player;
    this.source = base.source;
    this.energyMap = base.energyMap;
  }
}

export class CheckTableStateEffect implements Effect {
  readonly type: string = CheckEffects.CHECK_TABLE_STATE_EFFECT;
  public preventDefault = false;
  /** Bench size for every player, unless `benchSizes` says otherwise. */
  public benchSize: number;
  /**
   * Bench size per player (index into `state.players`). A card that changes
   * only one player's Bench (e.g. Area Zero Underdepths: "Each player who has
   * any Tera Pokémon in play can have up to 8 Pokémon on their Bench") sets
   * the entry for that player; an unset entry falls back to `benchSize`.
   */
  public benchSizes: (number | undefined)[] = [];

  constructor() {
    this.benchSize = 5;
  }
}

/**
 * How many attacks the Active Pokémon may use this turn. Asked after the
 * first attack; a card raises `attackCount` to let the Pokémon attack again
 * (e.g. the Festival Lead Ability: "this Pokémon may use an attack it has
 * twice").
 */
export class CheckAttackCountEffect implements Effect {
  readonly type: string = CheckEffects.CHECK_ATTACK_COUNT_EFFECT;
  public preventDefault = false;
  public player: Player;
  public target: PokemonSlot;
  public attackCount: number;

  constructor(player: Player, target: PokemonSlot) {
    this.player = player;
    this.target = target;
    this.attackCount = 1;
  }
}
