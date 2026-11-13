import {
  CardTarget,
  ChoosePokemonPrompt,
  Effect,
  GameError,
  GameMessage,
  PlayerType,
  SlotType,
  SpecialCondition,
  Stage,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

export class LisiasAppeal extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public set: string = 'SSP';

  public name: string = 'Lisia\'s Appeal';

  public fullName: string = 'Lisia\'s Appeal SSP';

  public text: string =
    'Switch in 1 of your opponent\'s Benched Basic Pokémon to the Active Spot. If you do, the new Active ' +
    'Pokémon is now Confused.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);
      const blocked: CardTarget[] = [];
      let hasBasic = false;
      opponent.bench.forEach((slot, index) => {
        const card = slot.getPokemonCard();
        if (card !== undefined && card.stage === Stage.BASIC) {
          hasBasic = true;
        } else {
          blocked.push({ player: PlayerType.TOP_PLAYER, slot: SlotType.BENCH, index });
        }
      });
      if (!hasBasic) {
        throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      }
      return store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_SWITCH,
        PlayerType.TOP_PLAYER,
        [SlotType.BENCH],
        { allowCancel: false, blocked }
      ), result => {
        const targets = result || [];
        if (targets.length === 0) {
          return;
        }
        opponent.switchPokemon(targets[0]);
        opponent.active.addSpecialCondition(SpecialCondition.CONFUSED);
      });
    }
    return state;
  }
}
