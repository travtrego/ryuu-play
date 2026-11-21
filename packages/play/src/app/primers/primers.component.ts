import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MODERN_DECKS, ModernDeck, modernDeckCards, modernDeckName } from '@ptcg/common';
import { finalize, switchMap } from 'rxjs/operators';

import { AlertService } from '../shared/alert/alert.service';
import { ApiError } from '../api/api.error';
import { CardsBaseService } from '../shared/cards/cards-base.service';
import { DeckService } from '../api/services/deck.service';
import { DeckPrimerAnalysis, PrimerPokemon, analyseDeck } from './deck-primer-analysis';
import { DECK_PRIMERS, DeckPrimerText } from './deck-primers';

/** Deck names are 3-32 characters (server validation, decks controller). */
const MAX_DECK_NAME = 32;

/**
 * A name for the copied deck that is not already used: the deck's name, or the name
 * with " 2", " 3", ... appended (shortened to fit the 32-character limit).
 */
export function uniqueDeckName(base: string, taken: string[]): string {
  if (!taken.includes(base)) {
    return base;
  }
  for (let i = 2; ; i++) {
    const suffix = ' ' + i;
    const name = base.slice(0, MAX_DECK_NAME - suffix.length).trim() + suffix;
    if (!taken.includes(name)) {
      return name;
    }
  }
}

/**
 * Learn mode, tutorial piece 4: deck primers. One page per modern Standard deck with
 * how it plays (written, `deck-primers.ts`), what is in it (generated from the cards,
 * `deck-primer-analysis.ts`), and a button that copies the list into the player's decks.
 *
 * The selected deck is in the URL fragment (/primers#sv-dragapult), so a primer can be
 * linked to.
 */
@Component({
  selector: 'ptcg-primers',
  templateUrl: './primers.component.html',
  styleUrls: ['./primers.component.scss']
})
export class PrimersComponent {

  public decks: ModernDeck[] = MODERN_DECKS;
  public selected: ModernDeck = MODERN_DECKS[0];
  public text: DeckPrimerText | undefined;
  public analysis: DeckPrimerAnalysis;
  public loading = false;
  /** Deck id in the player's list after "Add to my decks", for the "Open" link. */
  public addedDeckId: number | undefined;
  public addedDeckName = '';

  private destroyRef = inject(DestroyRef);

  constructor(
    private alertService: AlertService,
    private cardsBaseService: CardsBaseService,
    private deckService: DeckService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.select(MODERN_DECKS[0]);
    this.route.fragment.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(fragment => {
      const deck = MODERN_DECKS.find(d => d.id === fragment);
      if (deck !== undefined && deck !== this.selected) {
        this.select(deck);
      }
    });
  }

  public choose(deck: ModernDeck): void {
    this.select(deck);
    this.router.navigate([], { fragment: deck.id, replaceUrl: true });
  }

  public cardCount(deck: ModernDeck): number {
    return modernDeckCards(deck).length;
  }

  public showCard(pokemon: PrimerPokemon): void {
    this.cardsBaseService.showCardInfo({ card: pokemon.card });
  }

  public allPokemon(): PrimerPokemon[] {
    const list: PrimerPokemon[] = [];
    for (const line of this.analysis.lines) {
      for (const step of line.steps) {
        list.push(...step);
      }
    }
    return list;
  }

  public addToMyDecks(): void {
    const deck = this.selected;
    this.loading = true;
    this.deckService.getList().pipe(
      switchMap(response => {
        const name = uniqueDeckName(modernDeckName(deck), response.decks.map(d => d.name));
        return this.deckService.createDeck(name, modernDeckCards(deck));
      }),
      finalize(() => { this.loading = false; }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(response => {
      this.addedDeckId = response.deck.id;
      this.addedDeckName = response.deck.name;
      this.alertService.toast('Added "' + response.deck.name + '" to your decks.');
    }, (error: ApiError) => {
      if (!error.handled) {
        this.alertService.toast('Could not add the deck. Please try again.');
      }
    });
  }

  private select(deck: ModernDeck): void {
    this.selected = deck;
    this.text = DECK_PRIMERS[deck.id];
    this.analysis = analyseDeck(deck, name => this.cardsBaseService.getCardByName(name));
    this.addedDeckId = undefined;
    this.addedDeckName = '';
  }
}
