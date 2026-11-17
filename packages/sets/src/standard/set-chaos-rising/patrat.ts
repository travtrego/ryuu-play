import {
  CardType,
  Effect,
  PokemonCard,
  PowerEffect,
  PowerType,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

/** Patrat — Chaos Rising 70/86. */
export class Patrat extends PokemonCard {
  public static readonly WATCHFUL_EYE = 'Watchful Eye';

  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.COLORLESS];

  public hp: number = 70;

  public weakness = [{ type: CardType.FIGHTING }];

  public retreat = [CardType.COLORLESS];

  public powers = [
    {
      name: Patrat.WATCHFUL_EYE,
      powerType: PowerType.ABILITY,
      text: 'Damage counters on each Pokémon (both yours and your opponent\'s) can\'t be moved to other Pokémon.',
    },
  ];

  public attacks = [
    { name: 'Bite', cost: [CardType.COLORLESS], damage: '10', text: '' },
  ];

  public set: string = 'CRI';

  public name: string = 'Patrat';

  public fullName: string = 'Patrat CRI';

  /**
   * True when a Pokémon in play (either player's) has a working Watchful Eye.
   * The engine has no general "move damage counters" event, so each modern
   * card that moves damage counters asks this first (Munkidori's
   * Adrena-Brain is the only one in the modern format today).
   */
  public static blocksMovingDamage(store: StoreLike, state: State): boolean {
    for (const player of state.players) {
      for (const slot of [player.active, ...player.bench]) {
        const card = slot.getPokemonCard();
        const power = card?.powers.find(p => p.name === Patrat.WATCHFUL_EYE);
        if (card === undefined || power === undefined) {
          continue;
        }
        // An Ability lock (for example Flutter Mane) turns Watchful Eye off.
        try {
          store.reduceEffect(state, new PowerEffect(player, power, card));
        } catch {
          continue;
        }
        return true;
      }
    }
    return false;
  }

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // A passive Ability: only checked, never used.
    return state;
  }
}
