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
  PutDamageEffect,
  SlotType,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

/** Only 1 "Flip the Script" Ability each turn, whichever Pokémon has it. */
const FLIP_THE_SCRIPT_MARKER = 'FLIP_THE_SCRIPT_MARKER';

export class FezandipitiEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX];

  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.DARK];

  public hp: number = 210;

  public weakness = [{ type: CardType.FIGHTING }];

  public retreat = [CardType.COLORLESS];

  public powers = [
    {
      name: 'Flip the Script',
      useWhenInPlay: true,
      powerType: PowerType.ABILITY,
      text: 'Once during your turn, if any of your Pokémon were Knocked Out during your opponent\'s last turn, ' +
        'you may draw 3 cards. You can\'t use more than 1 Flip the Script Ability each turn.',
    },
  ];

  public attacks = [
    {
      name: 'Cruel Arrow',
      cost: [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
      damage: '',
      text: 'This attack does 100 damage to 1 of your opponent\'s Pokémon. (Don\'t apply Weakness and ' +
        'Resistance for Benched Pokémon.)',
    },
  ];

  public set: string = 'ASC';

  public name: string = 'Fezandipiti ex';

  public fullName: string = 'Fezandipiti ex ASC';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;
      if (StateUtils.findPokemonSlot(state, this) === undefined
        || !StateUtils.wasKnockedOutLastTurn(state, player)
        || player.deck.cards.length === 0) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      if (player.marker.hasMarker(FLIP_THE_SCRIPT_MARKER)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }
      player.marker.addMarker(FLIP_THE_SCRIPT_MARKER, this);
      player.deck.moveTo(player.hand, 3);
      return state;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);
      return store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
        PlayerType.TOP_PLAYER,
        [SlotType.ACTIVE, SlotType.BENCH],
        { allowCancel: false }
      ), targets => {
        const target = targets && targets.length > 0 ? targets[0] : opponent.active;
        if (target === opponent.active) {
          effect.damage = 100;
          return;
        }
        effect.damage = 0;
        const damage = new PutDamageEffect(effect, 100);
        damage.target = target;
        store.reduceEffect(state, damage);
      });
    }

    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(FLIP_THE_SCRIPT_MARKER);
    }

    return state;
  }
}
