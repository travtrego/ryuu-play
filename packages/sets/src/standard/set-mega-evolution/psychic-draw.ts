import {
  ConfirmPrompt,
  EvolveEffect,
  GameMessage,
  PokemonCard,
  PowerEffect,
  State,
  StoreLike,
} from '@ptcg/common';

/**
 * Psychic Draw (Kadabra / Alakazam MEG): "Once during your turn, when you play
 * this Pokémon from your hand to evolve 1 of your Pokémon, you may use this
 * Ability. Draw N cards." Rare Candy also plays the card from the hand to
 * evolve, so it triggers too.
 */
export function psychicDraw(store: StoreLike, state: State, effect: EvolveEffect, self: PokemonCard, count: number): State {
  const player = effect.player;
  if (!player.hand.cards.includes(self) || player.deck.cards.length === 0) {
    return state;
  }
  try {
    store.reduceEffect(state, new PowerEffect(player, self.powers[0], self));
  } catch {
    return state;
  }
  return store.prompt(state, new ConfirmPrompt(player.id, GameMessage.WANT_TO_USE_ABILITY), result => {
    if (result) {
      player.deck.moveTo(player.hand, count);
    }
  });
}
