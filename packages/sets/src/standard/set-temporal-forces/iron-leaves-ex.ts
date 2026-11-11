import {
  AttackEffect,
  CardTag,
  CardTarget,
  CardType,
  ConfirmPrompt,
  Effect,
  GameError,
  GameMessage,
  MoveEnergyPrompt,
  PlayerType,
  PlayPokemonEffect,
  PokemonCard,
  PowerEffect,
  PowerType,
  SlotType,
  Stage,
  State,
  StateUtils,
  StoreLike,
  UseAttackEffect,
} from '@ptcg/common';
import { commonMarkers } from '../../common';

function* useRapidVernier(
  next: Function,
  store: StoreLike,
  state: State,
  effect: PlayPokemonEffect,
  self: IronLeavesEx
): IterableIterator<State> {
  const player = effect.player;

  let wantToUse = false;
  yield store.prompt(state, new ConfirmPrompt(player.id, GameMessage.WANT_TO_USE_ABILITY), result => {
    wantToUse = result;
    next();
  });
  if (!wantToUse) {
    return state;
  }

  // By now the engine has put this Pokémon onto the Bench.
  const slot = StateUtils.findPokemonSlot(state, self);
  if (slot === undefined || !player.bench.includes(slot)) {
    return state;
  }
  player.switchPokemon(slot);

  // Then, you may move any amount of Energy from your other Pokémon to it.
  const selfTarget: CardTarget[] = [];
  const others: CardTarget[] = [];
  let otherEnergy = false;
  player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (s, card, target) => {
    if (s === player.active) {
      selfTarget.push(target);
    } else {
      others.push(target);
      otherEnergy = otherEnergy || s.energies.cards.length > 0;
    }
  });
  if (!otherEnergy) {
    return state;
  }

  return store.prompt(state, new MoveEnergyPrompt(
    player.id,
    GameMessage.MOVE_ENERGY_TO_ACTIVE,
    PlayerType.BOTTOM_PLAYER,
    [SlotType.ACTIVE, SlotType.BENCH],
    {},
    { allowCancel: true, min: 0, blockedFrom: selfTarget, blockedTo: others }
  ), transfers => {
    for (const transfer of transfers || []) {
      const source = StateUtils.getTarget(state, player, transfer.from);
      const target = StateUtils.getTarget(state, player, transfer.to);
      if (target === player.active && source !== player.active) {
        source.moveCardTo(transfer.card, target.energies);
      }
    }
  });
}

export class IronLeavesEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX, CardTag.FUTURE];

  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.GRASS];

  public hp: number = 220;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS];

  public powers = [
    {
      name: 'Rapid Vernier',
      powerType: PowerType.ABILITY,
      text: 'When you play this Pokémon from your hand onto your Bench during your turn, you may switch it with ' +
        'your Active Pokémon. If you do, you may move any amount of Energy from your other Pokémon to this Pokémon.',
    },
  ];

  public attacks = [
    {
      name: 'Prism Edge',
      cost: [CardType.GRASS, CardType.GRASS, CardType.COLORLESS],
      damage: '180',
      text: 'During your next turn, this Pokémon can\'t attack.',
    },
  ];

  public set: string = 'TEF';

  public name: string = 'Iron Leaves ex';

  public fullName: string = 'Iron Leaves ex TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    const yourNextTurn = commonMarkers.duringYourNextTurn(this, store, state, effect);

    if (effect instanceof PlayPokemonEffect && effect.pokemonCard === this
      && effect.target.pokemons.cards.length === 0 && effect.target !== effect.player.active) {
      const player = effect.player;
      try {
        store.reduceEffect(state, new PowerEffect(player, this.powers[0], this));
      } catch {
        return state;
      }
      const generator = useRapidVernier(() => generator.next(), store, state, effect, this);
      return generator.next().value;
    }

    if (effect instanceof UseAttackEffect
      && effect.player.active.getPokemonCard() === this
      && yourNextTurn.hasMarker(effect)) {
      throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      yourNextTurn.setMarker(effect);
    }

    return state;
  }
}
