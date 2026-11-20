import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { GameLog, GamePhase, GameWinner, Player, State, StateLog } from '@ptcg/common';

import { GameRecapComponent } from './game-recap.component';
import { LocalGameState } from '../../../shared/session/session.interface';

describe('GameRecapComponent', () => {
  let component: GameRecapComponent;
  let fixture: ComponentFixture<GameRecapComponent>;
  const myId = 1;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        TranslateModule.forRoot()
      ],
      declarations: [ GameRecapComponent ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GameRecapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function setState(phase: GamePhase, extra: Partial<LocalGameState> = {}) {
    const state = new State();
    const me = new Player();
    me.id = myId;
    me.name = 'Ash';
    const bot = new Player();
    bot.id = 2;
    bot.name = 'Bot';
    state.players = [me, bot];
    state.phase = phase;
    state.winner = phase === GamePhase.FINISHED ? GameWinner.PLAYER_2 : GameWinner.NONE;
    const logs = [
      new StateLog(GameLog.LOG_PLAYER_NO_ACTIVE_POKEMON, { name: 'Ash' }),
      new StateLog(GameLog.LOG_GAME_FINISHED_WINNER, { name: 'Bot' })
    ];
    component.clientId = myId;
    component.gameState = { localId: 1, gameId: 1, state, logs, deleted: false, ...extra } as unknown as LocalGameState;
    component.ngOnChanges();
    fixture.detectChanges();
  }

  it('renders nothing without a game or while the game is going', () => {
    expect(fixture.nativeElement.querySelector('.ptcg-game-recap-header')).toBeNull();
    setState(GamePhase.PLAYER_TURN);
    expect(fixture.nativeElement.querySelector('.ptcg-game-recap-header')).toBeNull();
  });

  it('shows the recap with a rules link when the game is finished', () => {
    setState(GamePhase.FINISHED);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.ptcg-game-recap-headline')!.textContent).toContain('Bot won this one.');
    expect(el.querySelector('[data-line="lesson-bench"]')).not.toBeNull();
    expect(el.querySelector('.ptcg-game-recap-link')).not.toBeNull();
  });

  it('shows nothing in replays', () => {
    setState(GamePhase.FINISHED, { replay: {} as any });
    expect(fixture.nativeElement.querySelector('.ptcg-game-recap-header')).toBeNull();
  });
});
