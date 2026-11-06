import {
  AfterDamageEffect,
  ChooseCardsPrompt,
  ChoosePokemonPrompt,
  Effect,
  EnergyCard,
  GameMessage,
  GamePhase,
  PlayerType,
  SlotType,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerType,
} from '@ptcg/common';

export class HandheldFan extends TrainerCard {
  public trainerType: TrainerType = TrainerType.TOOL;

  public set: string = 'TWM';

  public name: string = 'Handheld Fan';

  public fullName: string = 'Handheld Fan TWM';

  public text: string =
    'If the Pokémon this card is attached to is in the Active Spot and is damaged by an attack from your ' +
    'opponent\'s Pokémon (even if this Pokémon is Knocked Out), move an Energy from the Attacking Pokémon to ' +
    '1 of your opponent\'s Benched Pokémon.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AfterDamageEffect && effect.target.trainers.cards.includes(this)) {
      const attacker = effect.player;
      const owner = StateUtils.findOwner(state, effect.target);
      const source = effect.source;
      if (effect.damage <= 0 || attacker === owner || owner.active !== effect.target
        || state.phase !== GamePhase.ATTACK || source.energies.cards.length === 0
        || !attacker.bench.some(b => b.pokemons.cards.length > 0)) {
        return state;
      }

      let energy: EnergyCard | undefined;
      return store.prompt(state, new ChooseCardsPrompt(
        owner.id,
        GameMessage.MOVE_ENERGY_CARDS,
        source.energies,
        {},
        { min: 1, max: 1, allowCancel: false }
      ), selected => {
        energy = (selected || [])[0] as EnergyCard | undefined;
        if (energy === undefined) {
          return;
        }
        store.prompt(state, new ChoosePokemonPrompt(
          owner.id,
          GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,
          PlayerType.TOP_PLAYER,
          [SlotType.BENCH],
          { allowCancel: false }
        ), targets => {
          const target = (targets || [])[0];
          if (target !== undefined && energy !== undefined && source.energies.cards.includes(energy)) {
            source.moveCardTo(energy, target.energies);
          }
        });
      });
    }
    return state;
  }
}
