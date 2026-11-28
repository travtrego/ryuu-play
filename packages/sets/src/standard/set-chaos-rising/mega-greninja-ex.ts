import {
  AttackEffect,
  Card,
  CardTag,
  CardType,
  CheckProvidedEnergyEffect,
  ChooseCardsPrompt,
  ChoosePokemonPrompt,
  Effect,
  EndTurnEffect,
  EnergyCard,
  EnergyType,
  GameError,
  GameMessage,
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
} from '@ptcg/common';
import { BattleCage } from '../set-phantasmal-flames/battle-cage';
import { HideNSneak } from '../set-pitch-black/hide-n-sneak';

function isBasicWaterEnergy(card: Card): boolean {
  return card instanceof EnergyCard
    && card.energyType === EnergyType.BASIC
    && card.provides.includes(CardType.WATER);
}

function* useMortalShuriken(next: Function, store: StoreLike, state: State, effect: PowerEffect,
  self: MegaGreninjaEx): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);

  // Hide 'n' Sneak prevents the effects of the opponent's Abilities on that Pokémon.
  const blocked: { player: PlayerType, slot: SlotType, index: number }[] = [];
  let open = 0;
  opponent.forEachPokemon(PlayerType.TOP_PLAYER, (slot, card, position) => {
    if (HideNSneak.protects(store, state, player, slot)) {
      blocked.push(position);
    } else {
      open += 1;
    }
  });
  if (open === 0) {
    throw new GameError(GameMessage.CANNOT_USE_POWER);
  }

  let target: PokemonSlot | undefined;
  yield store.prompt(state, new ChoosePokemonPrompt(
    player.id,
    GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
    PlayerType.TOP_PLAYER,
    [SlotType.ACTIVE, SlotType.BENCH],
    { allowCancel: true, blocked }
  ), result => {
    target = result && result.length > 0 ? result[0] : undefined;
    next();
  });
  if (target === undefined) {
    return state;
  }

  // "Discard a Basic [W] Energy card from your hand in order to use this
  // Ability." Every Basic Water Energy card is the same, so take the first.
  const energy = player.hand.cards.find(isBasicWaterEnergy);
  if (energy === undefined) {
    return state;
  }
  player.hand.moveCardTo(energy, player.discard);
  player.marker.addMarker(self.MORTAL_SHURIKEN_MARKER, self);

  // Battle Cage stops counters on a Benched Pokémon.
  if (BattleCage.allowsCounters(state, player, target)) {
    target.damage += 60;
  }
  return state;
}

function* useNinjaSpinner(next: Function, store: StoreLike, state: State,
  effect: AttackEffect): IterableIterator<State> {
  const player = effect.player;
  const source = player.active;

  const provided = new CheckProvidedEnergyEffect(player, source);
  store.reduceEffect(state, provided);
  const water = provided.energyMap
    .filter(e => e.provides.includes(CardType.WATER))
    .map(e => e.card);
  if (water.length === 0) {
    return state;
  }

  const blocked: number[] = [];
  source.energies.cards.forEach((card, index) => {
    if (!water.includes(card)) {
      blocked.push(index);
    }
  });

  let cards: Card[] = [];
  yield store.prompt(state, new ChooseCardsPrompt(
    player.id,
    GameMessage.CHOOSE_CARD_TO_HAND,
    source.energies,
    {},
    { min: 0, max: 1, allowCancel: true, blocked }
  ), selected => {
    cards = selected || [];
    next();
  });

  if (cards.length === 0) {
    return state;
  }
  source.energies.moveCardsTo(cards as EnergyCard[], player.hand);
  effect.damage += 80;
  return state;
}

export class MegaGreninjaEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX, CardTag.MEGA_EVOLUTION_EX];

  public stage: Stage = Stage.STAGE_2;

  public evolvesFrom: string = 'Frogadier';

  public cardTypes: CardType[] = [CardType.WATER];

  public hp: number = 350;

  public weakness = [{ type: CardType.LIGHTNING }];

  public retreat = [CardType.COLORLESS];

  public powers = [
    {
      name: 'Mortal Shuriken',
      useWhenInPlay: true,
      powerType: PowerType.ABILITY,
      text: 'Once during your turn, if this Pokémon is in the Active Spot, you may discard a Basic W Energy card ' +
        'from your hand in order to use this Ability. Place 6 damage counters on 1 of your opponent\'s Pokémon.',
    },
  ];

  public attacks = [
    {
      name: 'Ninja Spinner',
      cost: [CardType.WATER, CardType.WATER],
      damage: '120+',
      text: 'You may put a W Energy attached to this Pokémon into your hand. If you do, this attack does 80 more ' +
        'damage.',
    },
  ];

  public set: string = 'CRI';

  public name: string = 'Mega Greninja ex';

  public fullName: string = 'Mega Greninja ex CRI';

  public readonly MORTAL_SHURIKEN_MARKER = 'MORTAL_SHURIKEN_MARKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;
      if (player.active.getPokemonCard() !== this) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      if (player.marker.hasMarker(this.MORTAL_SHURIKEN_MARKER, this)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }
      if (!player.hand.cards.some(isBasicWaterEnergy)) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      const generator = useMortalShuriken(() => generator.next(), store, state, effect, this);
      return generator.next().value;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const generator = useNinjaSpinner(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(this.MORTAL_SHURIKEN_MARKER, this);
    }

    return state;
  }
}
