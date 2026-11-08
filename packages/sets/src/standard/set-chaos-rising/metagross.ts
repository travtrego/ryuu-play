import {
  AttackEffect,
  CardType,
  ChooseEnergyPrompt,
  Card,
  CheckProvidedEnergyEffect,
  Effect,
  DiscardCardsEffect,
  GameMessage,
  PokemonCard,
  SelectPrompt,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

import { commonAttacks } from '../../common';

function* useMetallicHammer(
  next: Function,
  store: StoreLike,
  state: State,
  effect: AttackEffect
): IterableIterator<State> {
  const player = effect.player;

  const checkEnergy = new CheckProvidedEnergyEffect(player);
  store.reduceEffect(state, checkEnergy);
  if (!StateUtils.checkEnoughEnergy(checkEnergy.energyMap, [CardType.METAL, CardType.METAL, CardType.METAL])) {
    return state;
  }

  let discard = false;
  yield store.prompt(state, new SelectPrompt(
    player.id,
    GameMessage.CHOOSE_OPTION,
    ['Discard 3 Metal Energy for 150 more damage', 'Don\'t discard'],
    { allowCancel: false }
  ), choice => {
    discard = choice === 0;
    next();
  });

  if (!discard) {
    return state;
  }

  let cards: Card[] = [];
  yield store.prompt(state, new ChooseEnergyPrompt(
    player.id,
    GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
    checkEnergy.energyMap,
    [CardType.METAL, CardType.METAL, CardType.METAL],
    { allowCancel: false }
  ), energy => {
    cards = (energy || []).map(e => e.card);
    next();
  });

  if (cards.length === 0) {
    return state;
  }
  const discardEnergy = new DiscardCardsEffect(effect, cards);
  discardEnergy.target = player.active;
  store.reduceEffect(state, discardEnergy);
  effect.damage += 150;
  return state;
}

export class Metagross extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;

  public evolvesFrom = 'Metang';

  public cardTypes: CardType[] = [CardType.METAL];

  public hp: number = 180;

  public weakness = [{ type: CardType.FIRE }];

  public resistance = [{ type: CardType.GRASS, value: -30 }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Bounce Back',
      cost: [CardType.METAL],
      damage: '60',
      text: 'Switch out your opponent\'s Active Pokémon to the Bench. (Your opponent chooses the new Active Pokémon.)',
    },
    {
      name: 'Metallic Hammer',
      cost: [CardType.METAL, CardType.METAL, CardType.METAL, CardType.COLORLESS],
      damage: '150+',
      text: 'You may discard 3 M Energy from this Pokémon and have this attack do 150 more damage.',
    },
  ];

  public set: string = 'CRI';

  public name: string = 'Metagross';

  public fullName: string = 'Metagross CRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    const opponentSwitches = commonAttacks.opponentSwitchesDamageFirst(this, store, state, effect);

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      return opponentSwitches.use(effect);
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      const generator = useMetallicHammer(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    return state;
  }
}
