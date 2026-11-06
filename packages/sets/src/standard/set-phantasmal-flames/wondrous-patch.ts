import {
  AttachEnergyPrompt,
  CardTarget,
  CardType,
  CheckPokemonTypeEffect,
  Effect,
  EnergyCard,
  EnergyType,
  GameError,
  GameMessage,
  PlayerType,
  SlotType,
  State,
  StateUtils,
  StoreLike,
  SuperType,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

export class WondrousPatch extends TrainerCard {
  public trainerType: TrainerType = TrainerType.ITEM;

  public set: string = 'PFL';

  public name: string = 'Wondrous Patch';

  public fullName: string = 'Wondrous Patch PFL';

  public text: string = 'Attach a Basic P Energy card from your discard pile to 1 of your Benched P Pokémon.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const player = effect.player;
      const hasEnergy = player.discard.cards.some(c => c instanceof EnergyCard
        && c.energyType === EnergyType.BASIC && c.provides.includes(CardType.PSYCHIC));

      const blockedTo: CardTarget[] = [];
      let hasTarget = false;
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (slot, card, target) => {
        const type = new CheckPokemonTypeEffect(slot);
        store.reduceEffect(state, type);
        if (slot !== player.active && type.cardTypes.includes(CardType.PSYCHIC)) {
          hasTarget = true;
        } else {
          blockedTo.push(target);
        }
      });
      if (!hasEnergy || !hasTarget) {
        throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      }

      return store.prompt(state, new AttachEnergyPrompt(
        player.id,
        GameMessage.ATTACH_ENERGY_TO_BENCH,
        player.discard,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.BENCH],
        { superType: SuperType.ENERGY, energyType: EnergyType.BASIC, provides: [CardType.PSYCHIC] },
        { min: 1, max: 1, allowCancel: false, blockedTo }
      ), transfers => {
        for (const transfer of transfers || []) {
          const target = StateUtils.getTarget(state, player, transfer.to);
          player.discard.moveCardTo(transfer.card, target.energies);
        }
      });
    }
    return state;
  }
}
