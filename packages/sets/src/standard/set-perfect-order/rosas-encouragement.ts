import {
  AttachEnergyPrompt,
  CardTarget,
  EnergyCard,
  EnergyType,
  Effect,
  GameError,
  GameMessage,
  PlayerType,
  SlotType,
  Stage,
  State,
  StateUtils,
  StoreLike,
  SuperType,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

export class RosasEncouragement extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public set: string = 'POR';

  public name: string = 'Rosa\'s Encouragement';

  public fullName: string = 'Rosa\'s Encouragement POR';

  public text: string =
    'You can use this card only if you have more Prize cards remaining than your opponent. ' +
    'Attach up to 2 Basic Energy cards from your discard pile to 1 of your Stage 2 Pokémon.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      if (player.getPrizeLeft() <= opponent.getPrizeLeft()) {
        throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      }

      const hasBasicEnergy = player.discard.cards.some(c =>
        c instanceof EnergyCard && c.energyType === EnergyType.BASIC);
      const blockedTo: CardTarget[] = [];
      let hasStage2 = false;
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (slot, card, target) => {
        if (card.stage === Stage.STAGE_2) {
          hasStage2 = true;
        } else {
          blockedTo.push(target);
        }
      });
      if (!hasBasicEnergy || !hasStage2) {
        throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      }

      return store.prompt(state, new AttachEnergyPrompt(
        player.id,
        GameMessage.ATTACH_ENERGY_CARDS,
        player.discard,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.ACTIVE, SlotType.BENCH],
        { superType: SuperType.ENERGY, energyType: EnergyType.BASIC },
        { min: 1, max: 2, allowCancel: false, sameTarget: true, blockedTo }
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
