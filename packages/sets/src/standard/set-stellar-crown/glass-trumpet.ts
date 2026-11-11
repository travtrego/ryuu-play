import {
  AttachEnergyPrompt,
  CardTag,
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

export class GlassTrumpet extends TrainerCard {
  public trainerType: TrainerType = TrainerType.ITEM;

  public set: string = 'SCR';

  public name: string = 'Glass Trumpet';

  public fullName: string = 'Glass Trumpet SCR';

  public text: string =
    'You can use this card only if you have any Tera Pokémon in play. Choose up to 2 of your Benched C ' +
    'Pokémon and attach a Basic Energy card from your discard pile to each of them.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const player = effect.player;

      let hasTera = false;
      const blockedTo: CardTarget[] = [];
      let colorless = 0;
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (slot, card, target) => {
        if (card.tags.includes(CardTag.TERA)) {
          hasTera = true;
        }
        if (slot === player.active) {
          return;
        }
        const checkType = new CheckPokemonTypeEffect(slot);
        store.reduceEffect(state, checkType);
        if (checkType.cardTypes.includes(CardType.COLORLESS)) {
          colorless += 1;
        } else {
          blockedTo.push(target);
        }
      });
      if (!hasTera) {
        throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      }

      const basicEnergy = player.discard.cards.filter(c => c instanceof EnergyCard
        && c.energyType === EnergyType.BASIC).length;
      const max = Math.min(2, colorless, basicEnergy);
      if (max === 0) {
        // Nothing to attach: the card is played without effect.
        return state;
      }

      return store.prompt(state, new AttachEnergyPrompt(
        player.id,
        GameMessage.ATTACH_ENERGY_TO_BENCH,
        player.discard,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.BENCH],
        { superType: SuperType.ENERGY, energyType: EnergyType.BASIC },
        { min: 0, max, allowCancel: false, blockedTo, differentTargets: true }
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
