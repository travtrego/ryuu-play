import {
  AttackEffect,
  CardType,
  DamageMap,
  Effect,
  GameError,
  GameMessage,
  PlayerType,
  PokemonCard,
  PowerEffect,
  PowerType,
  PutCountersEffect,
  PutDamagePrompt,
  SlotType,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

export class FlutterMane extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.PSYCHIC];

  public hp: number = 90;

  public weakness = [{ type: CardType.METAL }];

  public retreat = [CardType.COLORLESS];

  public powers = [
    {
      name: 'Midnight Fluttering',
      powerType: PowerType.ABILITY,
      text: 'As long as this Pokémon is in the Active Spot, your opponent\'s Active Pokémon has no Abilities, ' +
        'except for Midnight Fluttering.',
    },
  ];

  public attacks = [
    {
      name: 'Hex Hurl',
      cost: [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
      damage: '90',
      text: 'Put 2 damage counters on your opponent\'s Benched Pokémon in any way you like.',
    },
  ];

  public set: string = 'TEF';

  public name: string = 'Flutter Mane';

  public fullName: string = 'Flutter Mane TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect
      && effect.power.powerType === PowerType.ABILITY
      && effect.power.name !== this.powers[0].name) {
      const owner = state.players.find(p => p.active.getPokemonCard() === this);
      if (owner !== undefined) {
        const opponent = StateUtils.getOpponent(state, owner);
        if (opponent.active.getPokemonCard() === effect.card) {
          // Is our own Ability blocked?
          try {
            store.reduceEffect(state, new PowerEffect(owner, this.powers[0], this));
          } catch {
            return state;
          }
          throw new GameError(GameMessage.BLOCKED_BY_ABILITY);
        }
      }
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);
      const maxAllowedDamage: DamageMap[] = [];
      opponent.forEachPokemon(PlayerType.TOP_PLAYER, (slot, card, target) => {
        if (slot !== opponent.active) {
          maxAllowedDamage.push({ target, damage: 20 });
        }
      });
      if (maxAllowedDamage.length === 0) {
        return state;
      }
      return store.prompt(state, new PutDamagePrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
        PlayerType.TOP_PLAYER,
        [SlotType.BENCH],
        20,
        maxAllowedDamage,
        { allowCancel: false }
      ), targets => {
        for (const result of targets || []) {
          const put = new PutCountersEffect(effect, result.damage);
          put.target = StateUtils.getTarget(state, player, result.target);
          store.reduceEffect(state, put);
        }
      });
    }

    return state;
  }
}
