import {
  AttachEnergyEffect,
  AttachEnergyPrompt,
  AttackEffect,
  CardTag,
  CardType,
  CheckProvidedEnergyEffect,
  Effect,
  EndTurnEffect,
  EnergyCard,
  EnergyType,
  GameError,
  GameMessage,
  HealEffect,
  Player,
  PlayerType,
  PokemonCard,
  PokemonSlot,
  PowerEffect,
  PowerType,
  SlotType,
  Stage,
  State,
  StateUtils,
  StoreLike,
  SuperType,
} from '@ptcg/common';

/**
 * The number of G Energy attached to all of a player's Pokémon, counting
 * what each card provides (a Basic G Energy under Meganium's Wild Growth
 * provides GG and counts as 2).
 */
export function countGrassEnergyInPlay(store: StoreLike, state: State, player: Player): number {
  let count = 0;
  const slots: PokemonSlot[] = [player.active, ...player.bench];
  slots.forEach(slot => {
    if (slot.pokemons.cards.length === 0) {
      return;
    }
    const check = new CheckProvidedEnergyEffect(player, slot);
    store.reduceEffect(state, check);
    check.energyMap.forEach(item => {
      if (item.provides.includes(CardType.GRASS)) {
        count += item.provideAmount;
      }
    });
  });
  return count;
}

export class HydrappleEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX];

  public stage: Stage = Stage.STAGE_2;

  public evolvesFrom: string = 'Dipplin';

  public cardTypes: CardType[] = [CardType.GRASS];

  public hp: number = 330;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS];

  public powers = [
    {
      name: 'Ripening Charge',
      powerType: PowerType.ABILITY,
      useWhenInPlay: true,
      text: 'Once during your turn, you may attach a Basic G Energy card from your hand to 1 of your Pokémon. ' +
        'If you attached Energy to a Pokémon in this way, heal 30 damage from that Pokémon.',
    },
  ];

  public attacks = [
    {
      name: 'Syrup Storm',
      cost: [CardType.COLORLESS, CardType.COLORLESS],
      damage: '30+',
      text: 'This attack does 30 more damage for each G Energy attached to all of your Pokémon.',
    },
  ];

  public set: string = 'SCR';

  public name: string = 'Hydrapple ex';

  public fullName: string = 'Hydrapple ex SCR';

  public readonly RIPENING_CHARGE_MARKER = 'RIPENING_CHARGE_MARKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;
      const slot = StateUtils.findPokemonSlot(state, this);
      if (slot === undefined || slot.getPokemonCard() !== this) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      if (player.marker.hasMarker(this.RIPENING_CHARGE_MARKER, this)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }
      if (!player.hand.cards.some(c => isBasicGrassEnergy(c))) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      const blocked: number[] = [];
      player.hand.cards.forEach((c, index) => {
        if (!isBasicGrassEnergy(c)) {
          blocked.push(index);
        }
      });
      return store.prompt(state, new AttachEnergyPrompt(
        player.id,
        GameMessage.ATTACH_ENERGY_CARDS,
        player.hand,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.ACTIVE, SlotType.BENCH],
        { superType: SuperType.ENERGY, energyType: EnergyType.BASIC },
        { min: 1, max: 1, allowCancel: true, blocked }
      ), transfers => {
        const list = transfers || [];
        if (list.length === 0) {
          return;
        }
        player.marker.addMarker(this.RIPENING_CHARGE_MARKER, this);
        const target = StateUtils.getTarget(state, player, list[0].to);
        const energy = list[0].card as EnergyCard;
        store.reduceEffect(state, new AttachEnergyEffect(player, energy, target));
        if (target.energies.cards.includes(energy)) {
          store.reduceEffect(state, new HealEffect(player, target, 30));
        }
      });
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      effect.damage += 30 * countGrassEnergyInPlay(store, state, effect.player);
      return state;
    }

    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(this.RIPENING_CHARGE_MARKER, this);
    }

    return state;
  }
}

function isBasicGrassEnergy(card: unknown): boolean {
  return card instanceof EnergyCard
    && card.energyType === EnergyType.BASIC
    && card.provides.includes(CardType.GRASS);
}
