import {
  AttachEnergyPrompt,
  AttackEffect,
  CardTag,
  CardTarget,
  CardType,
  ConfirmPrompt,
  Effect,
  EnergyCard,
  EnergyType,
  EvolveEffect,
  GameMessage,
  PlayerType,
  PokemonCard,
  PowerEffect,
  PowerType,
  ShuffleDeckPrompt,
  SlotType,
  Stage,
  State,
  StateUtils,
  StoreLike,
  SuperType,
} from '@ptcg/common';
import { commonAttacks } from '../../common';
import { isMarniesPokemon } from './marnie-utils';

function isBasicDarkEnergy(card: unknown): boolean {
  return card instanceof EnergyCard && card.energyType === EnergyType.BASIC && card.provides.includes(CardType.DARK);
}

function* usePunkUp(next: Function, store: StoreLike, state: State, effect: EvolveEffect,
  self: MarniesGrimmsnarlEx): IterableIterator<State> {
  const player = effect.player;

  // Only when played from the hand to evolve (also through Rare Candy).
  if (!player.hand.cards.includes(self) || player.deck.cards.length === 0) {
    return state;
  }
  try {
    store.reduceEffect(state, new PowerEffect(player, self.powers[0], self));
  } catch {
    return state;
  }

  let use = false;
  yield store.prompt(state, new ConfirmPrompt(player.id, GameMessage.WANT_TO_USE_ABILITY), result => {
    use = !!result;
    next();
  });
  if (!use) {
    return state;
  }

  // Asked after the evolution, so the new Grimmsnarl ex is a Marnie's Pokémon
  // too (and so was the Pokémon it evolved from).
  const blockedTo: CardTarget[] = [];
  player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (slot, card, target) => {
    if (!isMarniesPokemon(card)) {
      blockedTo.push(target);
    }
  });

  if (player.deck.cards.some(c => isBasicDarkEnergy(c))) {
    yield store.prompt(state, new AttachEnergyPrompt(
      player.id,
      GameMessage.ATTACH_ENERGY_CARDS,
      player.deck,
      PlayerType.BOTTOM_PLAYER,
      [SlotType.ACTIVE, SlotType.BENCH],
      { superType: SuperType.ENERGY, energyType: EnergyType.BASIC, provides: [CardType.DARK] },
      { min: 0, max: 5, allowCancel: false, blockedTo }
    ), transfers => {
      for (const transfer of transfers || []) {
        const target = StateUtils.getTarget(state, player, transfer.to);
        player.deck.moveCardTo(transfer.card, target.energies);
      }
      next();
    });
  }

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

/** Marnie's Grimmsnarl ex — Destined Rivals 136/182. */
export class MarniesGrimmsnarlEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX];

  public stage: Stage = Stage.STAGE_2;

  public evolvesFrom = 'Marnie\'s Morgrem';

  public cardTypes: CardType[] = [CardType.DARK];

  public hp: number = 320;

  public weakness = [{ type: CardType.GRASS }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public powers = [
    {
      name: 'Punk Up',
      powerType: PowerType.ABILITY,
      text: 'When you play this Pokémon from your hand to evolve 1 of your Pokémon during your turn, you may ' +
        'search your deck for up to 5 Basic D Energy cards and attach them to your Marnie\'s Pokémon in any way ' +
        'you like. Then, shuffle your deck.',
    },
  ];

  public attacks = [
    {
      name: 'Shadow Bullet',
      cost: [CardType.DARK, CardType.DARK],
      damage: '180',
      text: 'This attack also does 30 damage to 1 of your opponent\'s Benched Pokémon. (Don\'t apply Weakness ' +
        'and Resistance for Benched Pokémon.)',
    },
  ];

  public set: string = 'DRI';

  public name: string = 'Marnie\'s Grimmsnarl ex';

  public fullName: string = 'Marnie\'s Grimmsnarl ex DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof EvolveEffect && effect.pokemonCard === this) {
      const generator = usePunkUp(() => generator.next(), store, state, effect, this);
      return generator.next().value;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      // The Active takes the attack's 180 as usual; only the Bench target is chosen.
      const damageBench = commonAttacks.damageOpponentPokemon(this, store, state, effect);
      return damageBench.use(effect, 30, [SlotType.BENCH]);
    }

    return state;
  }
}
