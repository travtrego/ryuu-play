import {
  AttachEnergyEffect,
  AttachPokemonToolEffect,
  CardTag,
  CardType,
  Effect,
  GameError,
  GameMessage,
  PlayItemEffect,
  Player,
  PlayStadiumEffect,
  PlaySupporterEffect,
  PokemonCard,
  PowerEffect,
  PowerType,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

export class Genesect extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.METAL];

  public hp: number = 110;

  public weakness = [{ type: CardType.FIRE }];

  public resistance = [{ type: CardType.GRASS, value: -30 }];

  public retreat = [CardType.COLORLESS];

  public powers = [
    {
      name: 'ACE Nullifier',
      powerType: PowerType.ABILITY,
      text: 'If this Pokémon has a Pokémon Tool attached, your opponent can\'t play any ACE SPEC cards from their hand.',
    },
  ];

  public attacks = [
    {
      name: 'Magnetic Blast',
      cost: [CardType.METAL, CardType.COLORLESS, CardType.COLORLESS],
      damage: '100',
      text: '',
    },
  ];

  public set: string = 'SFA';

  public name: string = 'Genesect';

  public fullName: string = 'Genesect SFA';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    let played: { tags: string[] } | undefined;
    let player: Player | undefined;
    if (effect instanceof PlayItemEffect || effect instanceof PlaySupporterEffect
      || effect instanceof PlayStadiumEffect || effect instanceof AttachPokemonToolEffect) {
      played = effect.trainerCard;
      player = effect.player;
    } else if (effect instanceof AttachEnergyEffect) {
      played = effect.energyCard;
      player = effect.player;
    }
    if (played === undefined || player === undefined || !played.tags.includes(CardTag.ACE_SPEC)) {
      return state;
    }

    const slot = StateUtils.findPokemonSlot(state, this);
    if (slot === undefined || slot.getPokemonCard() !== this || slot.getTools().length === 0) {
      return state;
    }
    const owner = StateUtils.findOwner(state, slot);
    if (player === owner) {
      return state;
    }
    try {
      store.reduceEffect(state, new PowerEffect(owner, this.powers[0], this));
    } catch {
      return state;
    }
    throw new GameError(GameMessage.BLOCKED_BY_ABILITY);
  }
}
