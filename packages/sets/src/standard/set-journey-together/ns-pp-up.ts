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
  State,
  StateUtils,
  StoreLike,
  SuperType,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';
import { isNsPokemon } from './ns-utils';

export class NsPPUp extends TrainerCard {
  public trainerType: TrainerType = TrainerType.ITEM;

  public set: string = 'JTG';

  public name: string = 'N\'s PP Up';

  public fullName: string = 'N\'s PP Up JTG';

  public text: string =
    'Attach a Basic Energy card from your discard pile to 1 of your Benched N\'s Pokémon.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const player = effect.player;
      const hasBasicEnergy = player.discard.cards.some(c => c instanceof EnergyCard && c.energyType === EnergyType.BASIC);

      const blockedTo: CardTarget[] = [];
      let hasTarget = false;
      player.bench.forEach((slot, index) => {
        if (isNsPokemon(slot.getPokemonCard())) {
          hasTarget = true;
        } else {
          blockedTo.push({ player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index });
        }
      });

      if (!hasBasicEnergy || !hasTarget) {
        throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      }

      return store.prompt(state, new AttachEnergyPrompt(
        player.id,
        GameMessage.ATTACH_ENERGY_TO_BENCH,
        player.discard,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.BENCH],
        { superType: SuperType.ENERGY, energyType: EnergyType.BASIC },
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
