import {
  AttachEnergyPrompt,
  CardTarget,
  CardType,
  Effect,
  EnergyCard,
  EnergyType,
  GameMessage,
  PlayerType,
  ShuffleDeckPrompt,
  SlotType,
  SpecialCondition,
  State,
  StateUtils,
  StoreLike,
  SuperType,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

function* playCard(next: Function, store: StoreLike, state: State, effect: TrainerEffect): IterableIterator<State> {
  const player = effect.player;

  const blockedTo: CardTarget[] = [];
  player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (slot, card, target) => {
    if (!card.cardTypes.includes(CardType.DARK)) {
      blockedTo.push(target);
    }
  });

  const hasEnergy = player.deck.cards.some(c => c instanceof EnergyCard
    && c.energyType === EnergyType.BASIC && c.provides.includes(CardType.DARK));

  if (hasEnergy) {
    // One Basic D Energy each, on up to 2 different D Pokémon.
    yield store.prompt(state, new AttachEnergyPrompt(
      player.id,
      GameMessage.ATTACH_ENERGY_CARDS,
      player.deck,
      PlayerType.BOTTOM_PLAYER,
      [SlotType.ACTIVE, SlotType.BENCH],
      { superType: SuperType.ENERGY, energyType: EnergyType.BASIC, provides: [CardType.DARK] },
      { min: 0, max: 2, allowCancel: false, blockedTo, differentTargets: true }
    ), transfers => {
      let toActive = false;
      for (const transfer of transfers || []) {
        const target = StateUtils.getTarget(state, player, transfer.to);
        player.deck.moveCardTo(transfer.card, target.energies);
        toActive = toActive || target === player.active;
      }
      if (toActive) {
        player.active.addSpecialCondition(SpecialCondition.POISONED);
      }
      next();
    });
  }

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

export class JaninesSecretArt extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public set: string = 'PRE';

  public name: string = 'Janine\'s Secret Art';

  public fullName: string = 'Janine\'s Secret Art PRE';

  public text: string =
    'Choose up to 2 of your D Pokémon. For each of those Pokémon, search your deck for a Basic D Energy card ' +
    'and attach it to that Pokémon. Then, shuffle your deck. If you attached Energy to your Active Pokémon in ' +
    'this way, it is now Poisoned.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }
    return state;
  }
}
