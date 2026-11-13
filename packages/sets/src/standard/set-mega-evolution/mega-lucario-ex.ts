import {
  AttachEnergyPrompt,
  AttackEffect,
  CardTag,
  CardType,
  Effect,
  EnergyCard,
  EnergyType,
  GameError,
  GameMessage,
  PlayerType,
  PokemonCard,
  SlotType,
  Stage,
  State,
  StateUtils,
  StoreLike,
  SuperType,
  UseAttackEffect,
} from '@ptcg/common';
import { commonMarkers } from '../../common';

export class MegaLucarioEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX, CardTag.MEGA_EVOLUTION_EX];

  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom: string = 'Riolu';

  public cardTypes: CardType[] = [CardType.FIGHTING];

  public hp: number = 340;

  public weakness = [{ type: CardType.PSYCHIC }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Aura Jab',
      cost: [CardType.FIGHTING],
      damage: '130',
      text: 'Attach up to 3 Basic F Energy cards from your discard pile to your Benched Pokémon in any way ' +
        'you like.',
    },
    {
      name: 'Mega Brave',
      cost: [CardType.FIGHTING, CardType.FIGHTING],
      damage: '270',
      text: 'During your next turn, this Pokémon can\'t use Mega Brave.',
    },
  ];

  public set: string = 'MEG';

  public name: string = 'Mega Lucario ex';

  public fullName: string = 'Mega Lucario ex MEG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    const yourNextTurn = commonMarkers.duringYourNextTurn(this, store, state, effect);

    if (effect instanceof UseAttackEffect && effect.attack === this.attacks[1] && yourNextTurn.hasMarker(effect)) {
      throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      const hasBench = player.bench.some(b => b.pokemons.cards.length > 0);
      const hasEnergy = player.discard.cards.some(c => isBasicFightingEnergy(c));
      if (!hasBench || !hasEnergy) {
        return state;
      }
      const blocked: number[] = [];
      player.discard.cards.forEach((c, index) => {
        if (!isBasicFightingEnergy(c)) {
          blocked.push(index);
        }
      });
      return store.prompt(state, new AttachEnergyPrompt(
        player.id,
        GameMessage.ATTACH_ENERGY_CARDS,
        player.discard,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.BENCH],
        { superType: SuperType.ENERGY, energyType: EnergyType.BASIC },
        { min: 0, max: 3, allowCancel: true, blocked }
      ), transfers => {
        (transfers || []).forEach(transfer => {
          const target = StateUtils.getTarget(state, player, transfer.to);
          player.discard.moveCardTo(transfer.card, target.energies);
        });
      });
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      yourNextTurn.setMarker(effect);
    }

    return state;
  }
}

export function isBasicFightingEnergy(card: unknown): boolean {
  return card instanceof EnergyCard
    && card.energyType === EnergyType.BASIC
    && card.provides.includes(CardType.FIGHTING);
}
