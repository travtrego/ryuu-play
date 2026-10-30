import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { GamePhase, Player, State } from '@ptcg/common';

import { LearnTipsComponent } from './learn-tips.component';
import { LocalGameState } from '../../../shared/session/session.interface';

describe('LearnTipsComponent', () => {
  let component: LearnTipsComponent;
  let fixture: ComponentFixture<LearnTipsComponent>;
  const myId = 1;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MatTooltipModule,
        RouterTestingModule,
        TranslateModule.forRoot()
      ],
      declarations: [ LearnTipsComponent ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    try {
      window.localStorage.removeItem('ptcgShowLearnTips');
    } catch (error) {
      // ignore
    }
    fixture = TestBed.createComponent(LearnTipsComponent);
    component = fixture.componentInstance;
    component.showTips = true;
    fixture.detectChanges();
  });

  function setState(phase: GamePhase, extra: Partial<LocalGameState> = {}) {
    const state = new State();
    const me = new Player();
    me.id = myId;
    state.players = [me];
    state.phase = phase;
    component.clientId = myId;
    component.gameState = { localId: 1, gameId: 1, state, logs: [], deleted: false, ...extra } as unknown as LocalGameState;
    component.ngOnChanges();
    fixture.detectChanges();
  }

  function tipItems(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.ptcg-learn-tips-list li'));
  }

  it('should create and render nothing without a game', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.ptcg-learn-tips-header')).toBeNull();
  });

  it('shows the setup tip with a link to that section of the rules page', () => {
    setState(GamePhase.SETUP);
    const items = tipItems();
    expect(items.length).toBe(1);
    expect(items[0].getAttribute('data-tip')).toBe('setup');
    const link = items[0].querySelector('a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/rules#setup');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('shows no tips in replays or deleted games', () => {
    setState(GamePhase.SETUP, { replay: {} as any });
    expect(tipItems().length).toBe(0);
    setState(GamePhase.SETUP, { deleted: true });
    expect(tipItems().length).toBe(0);
  });

  it('can hide and show the tips, remembering the choice', () => {
    setState(GamePhase.SETUP);
    component.toggleTips();
    fixture.detectChanges();
    expect(tipItems().length).toBe(0);
    expect(fixture.nativeElement.querySelector('.ptcg-learn-tips-header')).not.toBeNull();
    expect(window.localStorage.getItem('ptcgShowLearnTips')).toBe('0');

    component.toggleTips();
    fixture.detectChanges();
    expect(tipItems().length).toBe(1);
  });
});
