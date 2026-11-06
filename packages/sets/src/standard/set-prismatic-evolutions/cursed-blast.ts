import {
  CheckHpEffect,
  ChoosePokemonPrompt,
  GameError,
  GameMessage,
  PlayerType,
  PokemonCard,
  PowerEffect,
  SlotType,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';
import { BattleCage } from '../set-phantasmal-flames/battle-cage';

/**
 * Cursed Blast (Dusclops / Dusknoir PRE): once during your turn, put N damage
 * counters on 1 of your opponent's Pokémon; then this Pokémon is Knocked Out
 * (the opponent takes its Prize card as usual).
 */
export function useCursedBlast(
  store: StoreLike,
  state: State,
  effect: PowerEffect,
  self: PokemonCard,
  counters: number
): State {
  const player = effect.player;
  const slot = StateUtils.findPokemonSlot(state, self);
  if (slot === undefined || slot.getPokemonCard() !== self) {
    throw new GameError(GameMessage.CANNOT_USE_POWER);
  }

  return store.prompt(state, new ChoosePokemonPrompt(
    player.id,
    GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
    PlayerType.TOP_PLAYER,
    [SlotType.ACTIVE, SlotType.BENCH],
    { allowCancel: true }
  ), targets => {
    if (!targets || targets.length === 0) {
      return;
    }
    // Battle Cage stops the counters on a Benched Pokémon; the Knock Out still happens.
    if (BattleCage.allowsCounters(state, player, targets[0])) {
      targets[0].damage += 10 * counters;
    }

    // "If you use this Ability, this Pokémon is Knocked Out."
    const checkHp = new CheckHpEffect(player, slot);
    store.reduceEffect(state, checkHp);
    slot.damage = Math.max(slot.damage, checkHp.hp);
  });
}
