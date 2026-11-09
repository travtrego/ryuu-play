import {
  AttackEffect,
  CardTag,
  CardType,
  ChoosePokemonPrompt,
  DiscardCardsEffect,
  Effect,
  GameMessage,
  PlayerType,
  PokemonCard,
  PutDamageEffect,
  SlotType,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

export class ZeraoraDRI extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.LIGHTNING];

  public hp: number = 100;

  public weakness = [{ type: CardType.FIGHTING }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Scratch',
      cost: [CardType.COLORLESS],
      damage: '20',
      text: '',
    },
    {
      name: 'Thunder Raid',
      cost: [CardType.LIGHTNING, CardType.LIGHTNING, CardType.LIGHTNING],
      damage: '',
      text: 'Discard all Energy from this Pokémon, and this attack does 210 damage to 1 of your opponent\'s ' +
        'Benched Pokémon ex. (Don\'t apply Weakness and Resistance for Benched Pokémon.)',
    },
  ];

  public set: string = 'DRI';

  public name: string = 'Zeraora';

  public fullName: string = 'Zeraora DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      const player = effect.player;
      const opponent = effect.opponent;

      // "This Pokémon" is the attacker (Slowking can copy this attack).
      const energies = player.active.energies.cards.slice();
      if (energies.length > 0) {
        const discard = new DiscardCardsEffect(effect, energies);
        discard.target = player.active;
        store.reduceEffect(state, discard);
      }

      const blocked: { player: PlayerType, slot: SlotType, index: number }[] = [];
      let hasTarget = false;
      opponent.bench.forEach((slot, index) => {
        const card = slot.getPokemonCard();
        if (card === undefined) {
          return;
        }
        if (card.tags.includes(CardTag.POKEMON_EX)) {
          hasTarget = true;
        } else {
          blocked.push({ player: PlayerType.TOP_PLAYER, slot: SlotType.BENCH, index });
        }
      });
      if (!hasTarget) {
        return state;
      }

      return store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
        PlayerType.TOP_PLAYER,
        [SlotType.BENCH],
        { min: 1, max: 1, allowCancel: false, blocked }
      ), selected => {
        for (const target of selected || []) {
          const damage = new PutDamageEffect(effect, 210);
          damage.target = target;
          store.reduceEffect(state, damage);
        }
      });
    }
    return state;
  }
}
