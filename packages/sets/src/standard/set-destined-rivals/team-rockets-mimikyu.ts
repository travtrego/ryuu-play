import {
  Attack,
  AttackEffect,
  CardTag,
  CardType,
  ChooseAttackPrompt,
  Effect,
  GameMessage,
  PokemonCard,
  Stage,
  State,
  StateUtils,
  StoreLike,
  UseAttackEffect,
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
      name: 'Gemstone Play',
      cost: [CardType.PSYCHIC, CardType.COLORLESS],
      damage: '',
      text:
        'Choose 1 of your opponent\'s Active Tera Pokémon\'s attacks and use it ' +
        'as this attack.',
    },
  ];

  public set: string = 'DRI';

  public name: string = 'Team Rocket\'s Mimikyu';

  public fullName: string = 'Team Rocket\'s Mimikyu DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);
      const activeCard = opponent.active.getPokemonCard();

      // Only a Tera Pokemon in the opponent's Active Spot can be copied. No
      // Tera card is implemented yet, so this attack currently never finds a
      // target and does nothing - which is the correct outcome rather than a
      // silent widening to any Pokemon.
      if (activeCard === undefined || !activeCard.tags.includes(CardTag.TERA)) {
        return state;
      }

      return store.prompt(
        state,
        new ChooseAttackPrompt(player.id, GameMessage.CHOOSE_ATTACK_TO_COPY, [activeCard], {
          allowCancel: true,
        }),
        result => {
          if (result !== null) {
            const attack = result as Attack;
            store.reduceEffect(state, new UseAttackEffect(player, attack));
          }
        }
      );
    }

    return state;
  }
}
