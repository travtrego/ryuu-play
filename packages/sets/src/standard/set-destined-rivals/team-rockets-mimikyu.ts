import {
  Attack,
  AttackEffect,
  CardTag,
  CardType,
  ChooseAttackPrompt,
  Effect,
  GameLog,
  GameMessage,
  PokemonCard,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

export class TeamRocketsMimikyu extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.PSYCHIC];

  public hp: number = 60;

  public weakness = [{ type: CardType.DARK }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [];

  public attacks = [
    {
      name: 'Gemstone Mimicry',
      cost: [CardType.PSYCHIC, CardType.COLORLESS],
      damage: '',
      text: 'Choose 1 of your opponent\'s Active Tera Pokémon\'s attacks and use it as this attack.',
    },
  ];

  public set: string = 'DRI';

  public name: string = 'Team Rocket\'s Mimikyu';

  public fullName: string = 'Team Rocket\'s Mimikyu DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      const opponent = effect.opponent;
      const opponentActive = opponent.active.getPokemonCard();

      // Only an Active Tera Pokémon's attacks can be copied; otherwise nothing happens.
      if (opponentActive === undefined
        || !opponentActive.tags.includes(CardTag.TERA)
        || opponentActive.attacks.length === 0) {
        return state;
      }

      return store.prompt(
        state,
        new ChooseAttackPrompt(player.id, GameMessage.CHOOSE_ATTACK_TO_COPY, [opponentActive], {
          allowCancel: false,
        }),
        result => {
          const attack = result as Attack | null;
          if (attack === null || attack === undefined) {
            return;
          }
          store.log(state, GameLog.LOG_PLAYER_COPIES_ATTACK, { name: player.name, attack: attack.name });
          const copied = new AttackEffect(player, opponent, attack);
          store.reduceEffect(state, copied);
          store.waitPrompt(state, () => {
            effect.damage = copied.damage;
          });
        }
      );
    }

    return state;
  }
}
