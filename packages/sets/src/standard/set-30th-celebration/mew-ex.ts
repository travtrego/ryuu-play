import {
  Attack,
  AttackEffect,
  CardTag,
  CardType,
  CheckAttackCostEffect,
  CheckProvidedEnergyEffect,
  ChooseAttackPrompt,
  ChoosePokemonPrompt,
  DealDamageEffect,
  Effect,
  GameError,
  GameMessage,
  PlayerType,
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

export class MewEx30C extends PokemonCard {
  public tags = [CardTag.POKEMON_EX];

  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.PSYCHIC];

  public hp: number = 160;

  public weakness = [{ type: CardType.DARK }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [];

  public powers = [
    {
      name: 'Memory Helix',
      useWhenInPlay: true,
      powerType: PowerType.ABILITY,
      text: 'This Pokémon can use the attacks of any of your Benched Pokémon. (You still need the ' +
        'necessary Energy to use each attack.)',
    },
  ];

  public attacks = [
    {
      name: 'Teleportation Burst',
      cost: [CardType.PSYCHIC],
      damage: '30',
      text: 'You may switch this Pokémon with 1 of your Benched Pokémon.',
    },
  ];

  public set: string = '30C';

  public name: string = 'Mew ex';

  public fullName: string = 'Mew ex 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Memory Helix works like Mew-EX's Versatile: from the Active Spot, the
    // Ability opens the list of usable Benched Pokémon's attacks, and the
    // chosen one is used as an attack (Energy, Special Conditions and
    // first-turn rules are checked as for any attack).
    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;
      if (player.active.getPokemonCard() !== this) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }

      const provided = new CheckProvidedEnergyEffect(player);
      store.reduceEffect(state, provided);

      const cards: PokemonCard[] = [];
      const blocked: { index: number, name: string }[] = [];
      player.bench.forEach(slot => {
        const card = slot.getPokemonCard();
        if (card === undefined || card.attacks.length === 0) {
          return;
        }
        const index = cards.length;
        cards.push(card);
        card.attacks.forEach(attack => {
          const cost = new CheckAttackCostEffect(player, attack);
          store.reduceEffect(state, cost);
          if (!StateUtils.checkEnoughEnergy(provided.energyMap, cost.cost)) {
            blocked.push({ index, name: attack.name });
          }
        });
      });

      const usable = cards.some((card, index) => card.attacks.some(a =>
        !blocked.some(b => b.index === index && b.name === a.name)));
      if (!usable) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }

      return store.prompt(state, new ChooseAttackPrompt(
        player.id,
        GameMessage.CHOOSE_ATTACK_TO_COPY,
        cards,
        { allowCancel: true, blocked }
      ), result => {
        const attack = result as Attack | null;
        if (attack !== null && attack !== undefined) {
          store.reduceEffect(state, new UseAttackEffect(player, attack));
        }
      });
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      // Deal the damage first, then switch.
      const damage = new DealDamageEffect(effect, effect.damage);
      effect.damage = 0;
      store.reduceEffect(state, damage);

      if (!player.bench.some(b => b.pokemons.cards.length > 0)) {
        return state;
      }
      return store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_SWITCH,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.BENCH],
        { allowCancel: true }
      ), targets => {
        if (targets && targets.length > 0) {
          player.switchPokemon(targets[0]);
        }
      });
    }

    return state;
  }
}
