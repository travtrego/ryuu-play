import { CardList } from './card-list';
import { CardTarget, PlayerType, SlotType } from '../actions/play-card-action';
import { PokemonCard } from '../card/pokemon-card';
import { Marker } from './card-marker';
import { PokemonSlot } from './pokemon-slot';

export class Player {

  id: number = 0;

  name: string = '';

  deck: CardList = new CardList();

  hand: CardList = new CardList();

  discard: CardList = new CardList();

  stadium: CardList = new CardList();

  supporter: CardList = new CardList();

  active: PokemonSlot = new PokemonSlot();

  bench: PokemonSlot[] = [];

  prizes: CardList[] = [];

  retreatedTurn: number = 0;

  /** True when this player moved a Pokémon into their Active Spot during the
   * current turn by retreat or a switching effect (not by promoting after a
   * Knock Out). Read by cards like Mega Lopunny ex; cleared at end of turn. */
  movedActiveThisTurn: boolean = false;

  energyPlayedTurn: number = 0;
  
  stadiumPlayedTurn: number = 0;

  stadiumUsedTurn: number = 0;

  /**
   * The turn in which one of this player's Pokémon was last Knocked Out
   * (-1: never). Modern cards ask "if any of your Pokémon were Knocked Out
   * during your opponent's last turn", see `StateUtils.wasKnockedOutLastTurn`.
   */
  knockedOutTurn: number = -1;

  marker = new Marker();

  avatarName: string = '';

  getPrizeLeft(): number {
    return this.prizes.reduce((left, p) => left + p.cards.length, 0);
  }

  forEachPokemon(
    player: PlayerType,
    handler: (pokemonSlot: PokemonSlot, pokemonCard: PokemonCard, target: CardTarget) => void
  ): void {
    let pokemonCard = this.active.getPokemonCard();
    let target: CardTarget;

    if (pokemonCard !== undefined) {
      target = { player, slot: SlotType.ACTIVE, index: 0 };
      handler(this.active, pokemonCard, target);
    }

    for (let i = 0; i < this.bench.length; i++) {
      pokemonCard = this.bench[i].getPokemonCard();
      if (pokemonCard !== undefined) {
        target = { player, slot: SlotType.BENCH, index: i };
        handler(this.bench[i], pokemonCard, target);
      }
    }
  }

  switchPokemon(target: PokemonSlot) {
    const benchIndex = this.bench.indexOf(target);
    if (benchIndex !== -1) {
      this.active.clearEffects();
      const temp = this.active;
      this.active = this.bench[benchIndex];
      this.bench[benchIndex] = temp;
      this.movedActiveThisTurn = true;
    }
  }

}
