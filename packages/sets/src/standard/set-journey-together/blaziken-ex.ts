import {
  AttachEnergyPrompt,
  AttackEffect,
  CardTag,
  CardType,
  Effect,
  EndTurnEffect,
  EnergyCard,
  EnergyType,
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
  SuperType,
  UseAttackEffect,
} from '@ptcg/common';
import { commonMarkers } from '../../common';

export class BlazikenEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX];

  public stage: Stage = Stage.STAGE_2;

  public evolvesFrom = 'Combusken';

  public cardTypes: CardType[] = [CardType.FIRE];

  public hp: number = 320;

  public weakness = [{ type: CardType.WATER }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public powers = [
    {
      name: 'Seething Spirit',
      useWhenInPlay: true,
      powerType: PowerType.ABILITY,
      text: 'Once during your turn, you may attach a Basic Energy card from your discard pile to 1 of your Pokémon.',
    },
  ];

  public attacks = [
    {
      name: 'Smolder-sault',
      cost: [CardType.FIRE, CardType.COLORLESS],
      damage: '200',
      text: 'During your next turn, this Pokémon can\'t attack.',
    },
  ];

  public set: string = 'JTG';

  public name: string = 'Blaziken ex';

  public fullName: string = 'Blaziken ex JTG';

  public readonly SEETHING_SPIRIT_MARKER = 'SEETHING_SPIRIT_MARKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    const yourNextTurn = commonMarkers.duringYourNextTurn(this, store, state, effect);

    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;
      const hasBasicEnergy = player.discard.cards.some(c => c instanceof EnergyCard && c.energyType === EnergyType.BASIC);
      if (StateUtils.findPokemonSlot(state, this) === undefined || !hasBasicEnergy) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      if (player.marker.hasMarker(this.SEETHING_SPIRIT_MARKER, this)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }
      return store.prompt(state, new AttachEnergyPrompt(
        player.id,
        GameMessage.ATTACH_ENERGY_CARDS,
        player.discard,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.ACTIVE, SlotType.BENCH],
        { superType: SuperType.ENERGY, energyType: EnergyType.BASIC },
        { min: 1, max: 1, allowCancel: true }
      ), transfers => {
        const list = transfers || [];
        if (list.length === 0) {
          return;
        }
        player.marker.addMarker(this.SEETHING_SPIRIT_MARKER, this);
        const target = StateUtils.getTarget(state, player, list[0].to);
        player.discard.moveCardTo(list[0].card, target.energies);
      });
    }

    if (effect instanceof UseAttackEffect
      && effect.player.active.getPokemonCard() === this
      && yourNextTurn.hasMarker(effect)) {
      throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      yourNextTurn.setMarker(effect);
      return state;
    }

    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(this.SEETHING_SPIRIT_MARKER, this);
    }

    return state;
  }
}
