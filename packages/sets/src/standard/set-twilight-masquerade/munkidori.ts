import {
  AddSpecialConditionsEffect,
  AttackEffect,
  CardType,
  CheckProvidedEnergyEffect,
  ChoosePokemonPrompt,
  Effect,
  EndTurnEffect,
  GameError,
  GameMessage,
  PlayerType,
  PokemonCard,
  PokemonSlot,
  PowerEffect,
  PowerType,
  SelectPrompt,
  SlotType,
  SpecialCondition,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

function* useAdrenaBrain(
  next: Function,
  store: StoreLike,
  state: State,
  effect: PowerEffect,
  self: Munkidori
): IterableIterator<State> {
  const player = effect.player;
  const blocked: { player: PlayerType, slot: SlotType, index: number }[] = [];
  player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (slot, card, target) => {
    if (slot.damage === 0) {
      blocked.push(target);
    }
  });

  let source: PokemonSlot | undefined;
  yield store.prompt(state, new ChoosePokemonPrompt(
    player.id,
    GameMessage.CHOOSE_POKEMON_TO_HEAL,
    PlayerType.BOTTOM_PLAYER,
    [SlotType.ACTIVE, SlotType.BENCH],
    { allowCancel: true, blocked }
  ), result => {
    source = result && result.length > 0 ? result[0] : undefined;
    next();
  });
  if (source === undefined) {
    return state;
  }

  let target: PokemonSlot | undefined;
  yield store.prompt(state, new ChoosePokemonPrompt(
    player.id,
    GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
    PlayerType.TOP_PLAYER,
    [SlotType.ACTIVE, SlotType.BENCH],
    { allowCancel: false }
  ), result => {
    target = result && result.length > 0 ? result[0] : undefined;
    next();
  });
  if (target === undefined) {
    return state;
  }

  const max = Math.min(3, Math.floor(source.damage / 10));
  let count = max;
  if (max > 1) {
    // Up to 3: the largest number first.
    const values = Array.from({ length: max }, (_, i) => String(max - i));
    yield store.prompt(state, new SelectPrompt(
      player.id,
      GameMessage.MOVE_DAMAGE,
      values,
      { allowCancel: false }
    ), choice => {
      const index = typeof choice === 'number' ? choice : 0;
      count = max - Math.max(0, Math.min(index, max - 1));
      next();
    });
  }

  player.marker.addMarker(self.ADRENA_BRAIN_MARKER, self);
  source.damage -= 10 * count;
  target.damage += 10 * count;
  return state;
}

export class Munkidori extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.PSYCHIC];

  public hp: number = 110;

  public weakness = [{ type: CardType.DARK }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [CardType.COLORLESS];

  public powers = [
    {
      name: 'Adrena-Brain',
      useWhenInPlay: true,
      powerType: PowerType.ABILITY,
      text: 'Once during your turn, if this Pokémon has any D Energy attached, you may move up to ' +
        '3 damage counters from 1 of your Pokémon to 1 of your opponent\'s Pokémon.',
    },
  ];

  public attacks = [
    {
      name: 'Mind Bend',
      cost: [CardType.PSYCHIC, CardType.COLORLESS],
      damage: '60',
      text: 'Your opponent\'s Active Pokémon is now Confused.',
    },
  ];

  public set: string = 'TWM';

  public name: string = 'Munkidori';

  public fullName: string = 'Munkidori TWM';

  public readonly ADRENA_BRAIN_MARKER = 'ADRENA_BRAIN_MARKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;
      const slot = StateUtils.findPokemonSlot(state, this);
      if (slot === undefined) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      if (player.marker.hasMarker(this.ADRENA_BRAIN_MARKER, this)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }

      const provided = new CheckProvidedEnergyEffect(player, slot);
      store.reduceEffect(state, provided);
      const hasDark = provided.energyMap.some(e => e.provides.includes(CardType.DARK));
      let hasDamaged = false;
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, s => { hasDamaged = hasDamaged || s.damage > 0; });
      if (!hasDark || !hasDamaged) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }

      const generator = useAdrenaBrain(() => generator.next(), store, state, effect, this);
      return generator.next().value;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      store.reduceEffect(state, new AddSpecialConditionsEffect(effect, [SpecialCondition.CONFUSED]));
    }

    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(this.ADRENA_BRAIN_MARKER, this);
    }

    return state;
  }
}
