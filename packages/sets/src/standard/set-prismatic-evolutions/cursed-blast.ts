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
import { HideNSneak } from '../set-pitch-black/hide-n-sneak';

/**
 * Cursed Blast (Dusclops / Dusknoir PRE): once during your turn, put N damage
 * counters on 1 of your opponent's Pokémon; then this Pokémon is Knocked Out
 * (the opponent takes its Prize card as usual). A Pokémon with Hide 'n' Sneak
 * can't be chosen.
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

  // Hide 'n' Sneak prevents the effects of the opponent's Abilities on that Pokémon.
  const opponent = StateUtils.getOpponent(state, player);
  const blocked: { player: PlayerType, slot: SlotType, index: number }[] = [];
  let open = 0;
  opponent.forEachPokemon(PlayerType.TOP_PLAYER, (target, card, position) => {
    if (HideNSneak.protects(store, state, player, target)) {
      blocked.push(position);
    } else {
      open += 1;
    }
  });
  if (open === 0) {
    throw new GameError(GameMessage.CANNOT_USE_POWER);
  }

  return store.prompt(state, new ChoosePokemonPrompt(
    player.id,
    GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
    PlayerType.TOP_PLAYER,
    [SlotType.ACTIVE, SlotType.BENCH],
    { allowCancel: true, blocked }
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
