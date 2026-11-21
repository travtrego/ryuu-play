import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MODERN_DECKS } from '@ptcg/common';
import { BehaviorSubject, of } from 'rxjs';

import { AlertService } from '../shared/alert/alert.service';
import { CardsBaseService } from '../shared/cards/cards-base.service';
import { DeckService } from '../api/services/deck.service';
import { PrimersComponent, uniqueDeckName } from './primers.component';

describe('uniqueDeckName', () => {
  it('keeps the name when it is free', () => {
    expect(uniqueDeckName('Dragapult ex', ['Other'])).toBe('Dragapult ex');
  });

  it('appends a number when the name is taken', () => {
    expect(uniqueDeckName('Dragapult ex', ['Dragapult ex'])).toBe('Dragapult ex 2');
    expect(uniqueDeckName('Dragapult ex', ['Dragapult ex', 'Dragapult ex 2'])).toBe('Dragapult ex 3');
  });

  it('stays within 32 characters', () => {
    const long = 'Mega Sharpedo ex / Toxtricity ab';
    expect(long.length).toBe(32);
    const name = uniqueDeckName(long, [long]);
    expect(name.length).toBeLessThanOrEqual(32);
    expect(name.endsWith(' 2')).toBeTrue();
  });
});

describe('PrimersComponent', () => {
  let fixture: ComponentFixture<PrimersComponent>;
  let fragment: BehaviorSubject<string | null>;
  let deckService: jasmine.SpyObj<DeckService>;
  let alertService: jasmine.SpyObj<AlertService>;
  let router: jasmine.SpyObj<Router>;

  function create(initial: string | null) {
    fragment = new BehaviorSubject<string | null>(initial);
    deckService = jasmine.createSpyObj('DeckService', ['getList', 'createDeck']);
    alertService = jasmine.createSpyObj('AlertService', ['toast']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    const cardsBaseService = jasmine.createSpyObj('CardsBaseService', ['getCardByName', 'showCardInfo']);
    cardsBaseService.getCardByName.and.returnValue(undefined);
    TestBed.configureTestingModule({
      imports: [ TranslateModule.forRoot() ],
      declarations: [ PrimersComponent ],
      providers: [
        { provide: ActivatedRoute, useValue: { fragment } },
        { provide: Router, useValue: router },
        { provide: DeckService, useValue: deckService },
        { provide: AlertService, useValue: alertService },
        { provide: CardsBaseService, useValue: cardsBaseService },
      ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
    });
    fixture = TestBed.createComponent(PrimersComponent);
    fixture.detectChanges();
  }

  it('shows a button for every modern deck and the first deck\'s primer', () => {
    create(null);
    const buttons = fixture.nativeElement.querySelectorAll('.ptcg-primers-toc button');
    expect(buttons.length).toBe(MODERN_DECKS.length);
    expect(fixture.componentInstance.selected).toBe(MODERN_DECKS[0]);
    expect(fixture.nativeElement.querySelector('.ptcg-primers-plan')).not.toBeNull();
  });

  it('opens the deck named in the URL fragment', () => {
    create('sv-mega-lucario');
    expect(fixture.componentInstance.selected.id).toBe('sv-mega-lucario');
  });

  it('puts the chosen deck in the URL fragment', () => {
    create(null);
    const deck = MODERN_DECKS[2];
    fixture.componentInstance.choose(deck);
    expect(fixture.componentInstance.selected).toBe(deck);
    expect(router.navigate).toHaveBeenCalledWith([], { fragment: deck.id, replaceUrl: true });
  });

  it('copies the 60 cards into a new deck with a free name', () => {
    create('sv-dragapult');
    deckService.getList.and.returnValue(of({ ok: true, decks: [
      { id: 1, name: 'Dragapult ex', formatNames: [], cardType: [], isValid: true }
    ] }) as any);
    deckService.createDeck.and.returnValue(of({ ok: true, deck: {
      id: 7, name: 'Dragapult ex 2', cardType: [], formatNames: [], isValid: true, cards: []
    } }) as any);

    fixture.componentInstance.addToMyDecks();

    expect(deckService.createDeck).toHaveBeenCalledTimes(1);
    const [name, cards] = deckService.createDeck.calls.mostRecent().args;
    expect(name).toBe('Dragapult ex 2');
    expect(cards.length).toBe(60);
    expect(cards.filter(c => c === 'Dragapult ex TWM').length).toBe(3);
    expect(fixture.componentInstance.addedDeckId).toBe(7);
    expect(alertService.toast).toHaveBeenCalled();
  });
});
