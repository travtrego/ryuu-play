import {
  AttackEffect,
  CardType,
  Effect,
  GameMessage,
  MoveEnergyPrompt,
  PlayerType,
  PokemonCard,
  SlotType,
  Stage,
  State,
  StateUtils,
  StoreLike,
  SuperType,
} from '@ptcg/common';

export class Elgyem extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.PSYCHIC];

  public hp: number = 60;

  public weakness = [{ type: CardType.DARK }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Slight Shift',
      cost: [CardType.PSYCHIC],
      damage: '',
      text: 'Move an Energy from 1 of your opponent\'s Pokémon to another of their Pokémon.',
    },
    { name: 'Beam', cost: [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS], damage: '40', text: '' },
  ];

  public set: string = 'BLK';

  public name: string = 'Elgyem';

  public fullName: string = 'Elgyem BLK';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);
      let inPlay = 0;
      let hasEnergy = false;
      opponent.forEachPokemon(PlayerType.TOP_PLAYER, slot => {
        inPlay += 1;
        hasEnergy = hasEnergy || slot.energies.cards.length > 0;
      });
      if (inPlay < 2 || !hasEnergy) {
        return state;
      }
      return store.prompt(state, new MoveEnergyPrompt(
        player.id,
        GameMessage.MOVE_ENERGY_CARDS,
        PlayerType.TOP_PLAYER,
        [SlotType.ACTIVE, SlotType.BENCH],
        { superType: SuperType.ENERGY },
        { min: 1, max: 1, allowCancel: false }
      ), transfers => {
        for (const transfer of transfers || []) {
          const source = StateUtils.getTarget(state, player, transfer.from);
          const target = StateUtils.getTarget(state, player, transfer.to);
          source.moveCardTo(transfer.card, target.energies);
        }
      });
    }
    return state;
  }
}
