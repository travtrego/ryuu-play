import {
  Attack,
  AttackEffect,
  CardType,
  ChooseAttackPrompt,
  Effect,
  GameLog,
  GameMessage,
  PokemonCard,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

export class Slowking extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom: string = 'Slowpoke';

  public cardTypes: CardType[] = [CardType.PSYCHIC];

  public hp: number = 120;

  public weakness = [{ type: CardType.DARK }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Seek Inspiration',
      cost: [CardType.PSYCHIC, CardType.COLORLESS],
      damage: '',
      text: 'Discard the top card of your deck. If that card is a Pokémon that doesn\'t have a Rule Box, ' +
        'choose 1 of its attacks and use it as this attack. (Pokémon ex, Pokémon V, etc. have Rule Boxes.)',
    },
    {
      name: 'Super Psy Bolt',
      cost: [CardType.PSYCHIC, CardType.PSYCHIC, CardType.COLORLESS],
      damage: '120',
      text: '',
    },
  ];

  public set: string = 'SCR';

  public name: string = 'Slowking';

  public fullName: string = 'Slowking SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      const opponent = effect.opponent;

      if (player.deck.cards.length === 0) {
        return state;
      }
      const top = player.deck.cards[0];
      player.deck.moveTo(player.discard, 1);

      if (!(top instanceof PokemonCard) || StateUtils.hasRuleBox(top) || top.attacks.length === 0) {
        return state;
      }

      return store.prompt(state, new ChooseAttackPrompt(
        player.id,
        GameMessage.CHOOSE_ATTACK_TO_COPY,
        [top],
        { allowCancel: false }
      ), result => {
        const attack = result as Attack | null;
        if (attack === null || attack === undefined) {
          return;
        }
        store.log(state, GameLog.LOG_PLAYER_COPIES_ATTACK, { name: player.name, attack: attack.name });
        // The copied attack is used by this Pokémon: "this Pokémon" in its
        // text means Slowking, and Slowking's Energy pays nothing extra.
        const copied = new AttackEffect(player, opponent, attack);
        store.reduceEffect(state, copied);
        store.waitPrompt(state, () => {
          effect.damage = copied.damage;
        });
      });
    }

    return state;
  }
}
