import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { GamePhase, Player, Rules, State } from '@ptcg/common';

import { TutorialCoachComponent } from './tutorial-coach.component';
import { LocalGameState } from '../../../shared/session/session.interface';

describe('TutorialCoachComponent', () => {
  let component: TutorialCoachComponent;
  let fixture: ComponentFixture<TutorialCoachComponent>;
  const myId = 1;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        TranslateModule.forRoot()
      ],
      declarations: [ TutorialCoachComponent ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TutorialCoachComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function setState(tutorial: boolean, phase: GamePhase, extra: Partial<LocalGameState> = {}) {
    const state = new State();
    state.rules = new Rules({ tutorial });
    const me = new Player();
    me.id = myId;
    const bot = new Player();
    bot.id = 2;
    state.players = [me, bot];
    state.phase = phase;
    state.turn = 2;
    state.activePlayer = 1;
    component.clientId = myId;
    component.gameState = { localId: 1, gameId: 1, state, logs: [], deleted: false, ...extra } as unknown as LocalGameState;
    component.ngOnChanges();
    fixture.detectChanges();
  }

  function lessonEl(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.ptcg-tutorial-coach-lesson');
  }

  it('shows nothing in a game that is not a tutorial', () => {
    setState(false, GamePhase.SETUP);
    expect(lessonEl()).toBeNull();
  });

  it('shows nothing in a replay', () => {
    setState(true, GamePhase.SETUP, { replay: {} as any });
    expect(lessonEl()).toBeNull();
  });

  it('shows the setup lesson with a link to the rules page', () => {
    setState(true, GamePhase.SETUP);
    expect(lessonEl()?.getAttribute('data-lesson')).toBe('setup');
    expect(lessonEl()?.textContent).toContain('as your Active Pokémon');
    const link = fixture.nativeElement.querySelector('.ptcg-tutorial-coach-link') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/rules#setup');
  });

  it('moves past a read lesson when the player clicks Got it', () => {
    setState(true, GamePhase.PLAYER_TURN);
    expect(lessonEl()?.getAttribute('data-lesson')).toBe('bot-turn');
    const button = fixture.nativeElement.querySelector('.ptcg-tutorial-coach-actions button') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    expect(lessonEl()).toBeNull();
  });
});
