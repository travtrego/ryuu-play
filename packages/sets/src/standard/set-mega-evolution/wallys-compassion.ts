import {
  CardTag,
  CardTarget,
  ChoosePokemonPrompt,
  Effect,
  GameError,
  GameMessage,
  HealEffect,
  PlayerType,
  PokemonSlot,
  SlotType,
  State,
  StoreLike,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

export class WallysCompassion extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public set: string = 'MEG';

  public name: string = 'Wally\'s Compassion';

  public fullName: string = 'Wally\'s Compassion MEG';

  public text: string =
    'Heal all damage from 1 of your Mega Evolution Pokémon ex. If you healed any damage in this way, put all ' +
    'Energy attached to that Pokémon into your hand.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const player = effect.player;
      const blocked: CardTarget[] = [];
      let hasTarget = false;
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (slot, card, target) => {
        if (card.tags.includes(CardTag.MEGA_EVOLUTION_EX)) {
          hasTarget = true;
        } else {
          blocked.push(target);
        }
      });
      if (!hasTarget) {
        throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      }
      return store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_HEAL,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.ACTIVE, SlotType.BENCH],
        { min: 1, max: 1, allowCancel: false, blocked }
      ), targets => {
        const slots = (targets || []) as PokemonSlot[];
        if (slots.length === 0) {
          return;
        }
        const slot = slots[0];
        const healed = slot.damage;
        if (healed > 0) {
          store.reduceEffect(state, new HealEffect(player, slot, healed));
          slot.energies.moveTo(player.hand);
        }
      });
    }
    return state;
  }
}
