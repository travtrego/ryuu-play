import {
  AttackEffect,
  CardType,
  DealDamageEffect,
  Effect,
  EndTurnEffect,
  PokemonCard,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

export class ChikoritaASC extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.GRASS];

  public hp: number = 70;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Growl',
      cost: [CardType.COLORLESS],
      damage: '',
      text: 'During your opponent\'s next turn, attacks used by the Defending Pokémon do 20 less damage ' +
        '(before applying Weakness and Resistance).',
    },
    {
      name: 'Seed Bomb',
      cost: [CardType.GRASS, CardType.GRASS],
      damage: '30',
      text: '',
    },
  ];

  public set: string = 'ASC';

  public name: string = 'Chikorita';

  public fullName: string = 'Chikorita ASC';

  public readonly GROWL_MARKER = 'CHIKORITA_ASC_GROWL_MARKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      effect.opponent.active.marker.addMarker(this.GROWL_MARKER, this);
      return state;
    }

    // Only damage to the other player's Pokémon is reduced (not damage an
    // attack does to the attacker itself).
    if (effect instanceof DealDamageEffect && effect.source.marker.hasMarker(this.GROWL_MARKER, this)
      && StateUtils.findOwner(state, effect.target) !== effect.player) {
      effect.damage = Math.max(0, effect.damage - 20);
      return state;
    }

    // The marker lasts until the end of the opponent's next turn: at the end
    // of a turn, it is removed from the Pokémon of the player whose turn ends.
    if (effect instanceof EndTurnEffect) {
      effect.player.active.marker.removeMarker(this.GROWL_MARKER, this);
      effect.player.bench.forEach(b => b.marker.removeMarker(this.GROWL_MARKER, this));
    }

    return state;
  }
}
