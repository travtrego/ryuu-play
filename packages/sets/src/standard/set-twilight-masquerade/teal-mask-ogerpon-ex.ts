import {
  AttackEffect,
  CheckProvidedEnergyEffect,
  CardTag,
  CardType,
  ChooseCardsPrompt,
  Effect,
  EndTurnEffect,
  EnergyCard,
  EnergyType,
  GameError,
  GameMessage,
  Player,
  PokemonSlot,
  PokemonCard,
  PowerEffect,
  PowerType,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

export class TealMaskOgerponEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX, CardTag.TERA];

  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.GRASS];

  public hp: number = 210;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS];

  public powers = [
    {
      name: 'Teal Dance',
      powerType: PowerType.ABILITY,
      useWhenInPlay: true,
      text: 'Once during your turn, you may attach a Basic G Energy card from your hand to this Pokémon. ' +
        'If you attached Energy to a Pokémon in this way, draw a card.',
    },
  ];

  public attacks = [
    {
      name: 'Myriad Leaf Shower',
      cost: [CardType.GRASS, CardType.GRASS, CardType.GRASS],
      damage: '30+',
      text: 'This attack does 30 more damage for each Energy attached to both Active Pokémon.',
    },
  ];

  public set: string = 'TWM';

  public name: string = 'Teal Mask Ogerpon ex';

  public fullName: string = 'Teal Mask Ogerpon ex TWM';

  public readonly TEAL_DANCE_MARKER = 'TEAL_DANCE_MARKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;
      const slot = StateUtils.findPokemonSlot(state, this);
      if (slot === undefined || slot.getPokemonCard() !== this) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      if (player.marker.hasMarker(this.TEAL_DANCE_MARKER, this)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }
      const blocked: number[] = [];
      player.hand.cards.forEach((card, index) => {
        if (!isBasicGrassEnergy(card)) {
          blocked.push(index);
        }
      });
      if (blocked.length === player.hand.cards.length) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      return store.prompt(state, new ChooseCardsPrompt(
        player.id,
        GameMessage.ATTACH_ENERGY_CARDS,
        player.hand,
        {},
        { min: 1, max: 1, allowCancel: true, blocked }
      ), selected => {
        const cards = selected || [];
        if (cards.length === 0) {
          return;
        }
        player.marker.addMarker(this.TEAL_DANCE_MARKER, this);
        player.hand.moveCardTo(cards[0], slot.energies);
        player.deck.moveTo(player.hand, 1);
      });
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      // Energy is counted by what it provides (a Basic G Energy under
      // Meganium's Wild Growth provides GG and counts as 2).
      const energies = countProvidedEnergy(store, state, effect.player, effect.player.active)
        + countProvidedEnergy(store, state, effect.opponent, effect.opponent.active);
      effect.damage += 30 * energies;
      return state;
    }

    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(this.TEAL_DANCE_MARKER, this);
    }

    return state;
  }
}

function isBasicGrassEnergy(card: unknown): boolean {
  return card instanceof EnergyCard
    && card.energyType === EnergyType.BASIC
    && card.provides.includes(CardType.GRASS);
}

function countProvidedEnergy(store: StoreLike, state: State, player: Player, slot: PokemonSlot): number {
  const check = new CheckProvidedEnergyEffect(player, slot);
  store.reduceEffect(state, check);
  return check.energyMap.reduce((sum, item) => sum + item.provideAmount, 0);
}
