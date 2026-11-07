import {
  AttackEffect,
  CardTag,
  CardType,
  ChoosePokemonPrompt,
  Effect,
  EndTurnEffect,
  GameError,
  GameMessage,
  PlayerType,
  PokemonCard,
  PowerEffect,
  PowerType,
  SlotType,
  SpecialCondition,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

/** Only 1 Subjugating Chains Ability each turn, whichever Pecharunt ex has it. */
const SUBJUGATING_CHAINS_MARKER = 'SUBJUGATING_CHAINS_MARKER';

function canBeChained(card: PokemonCard | undefined): boolean {
  return card !== undefined
    && card.cardTypes.includes(CardType.DARK)
    && card.name !== 'Pecharunt ex';
}

export class PecharuntEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX];

  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.DARK];

  public hp: number = 190;

  public weakness = [{ type: CardType.FIGHTING }];

  public retreat = [CardType.COLORLESS];

  public powers = [
    {
      name: 'Subjugating Chains',
      useWhenInPlay: true,
      powerType: PowerType.ABILITY,
      text: 'Once during your turn, you may switch 1 of your Benched D Pokémon, except any Pecharunt ex, ' +
        'with your Active Pokémon. If you do, the new Active Pokémon is now Poisoned. You can\'t use more ' +
        'than 1 Subjugating Chains Ability each turn.',
    },
  ];

  public attacks = [
    {
      name: 'Irritated Outburst',
      cost: [CardType.DARK, CardType.DARK],
      damage: '60×',
      text: 'This attack does 60 damage for each Prize card your opponent has taken.',
    },
  ];

  public set: string = 'SFA';

  public name: string = 'Pecharunt ex';

  public fullName: string = 'Pecharunt ex SFA';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;
      if (StateUtils.findPokemonSlot(state, this) === undefined) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      if (player.marker.hasMarker(SUBJUGATING_CHAINS_MARKER)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }
      const blocked: number[] = [];
      player.bench.forEach((slot, index) => {
        if (!canBeChained(slot.getPokemonCard())) {
          blocked.push(index);
        }
      });
      if (blocked.length === player.bench.length) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      const blockedTo = blocked.map(index => ({ player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index }));
      return store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_SWITCH,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.BENCH],
        { allowCancel: true, blocked: blockedTo }
      ), targets => {
        if (!targets || targets.length === 0) {
          return;
        }
        player.marker.addMarker(SUBJUGATING_CHAINS_MARKER, this);
        player.switchPokemon(targets[0]);
        player.active.addSpecialCondition(SpecialCondition.POISONED);
      });
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const taken = Math.max(0, 6 - effect.opponent.getPrizeLeft());
      effect.damage = 60 * taken;
    }

    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(SUBJUGATING_CHAINS_MARKER);
    }

    return state;
  }
}
