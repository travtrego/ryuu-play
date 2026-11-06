import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { GameLog, Player, State, StateLog } from '@ptcg/common';

import { ApiModule } from '../../../api/api.module';
import { GameLogsComponent } from './game-logs.component';
import { LocalGameState } from '../../../shared/session/session.interface';
import { SessionService } from '../../../shared/session/session.service';

describe('GameLogsComponent', () => {
  let component: GameLogsComponent;
  let fixture: ComponentFixture<GameLogsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ApiModule,
        FormsModule,
        MatInputModule,
        MatTooltipModule,
        TranslateModule.forRoot()
      ],
      declarations: [ GameLogsComponent ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GameLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('bot explanations (learn mode)', () => {
    const botClientId = 7;

    function createLog(id: number, message: GameLog, params: any): StateLog {
      const log = new StateLog(message, params, botClientId);
      log.id = id;
      return log;
    }

    function setLogs(logs: StateLog[]) {
      const state = new State();
      const bot = new Player();
      bot.id = botClientId;
      state.players = [bot];
      component.gameState = { localId: 1, gameId: 1, state, logs, deleted: false } as unknown as LocalGameState;
      fixture.detectChanges();
    }

    beforeEach(() => {
      try {
        window.localStorage.removeItem('ptcgShowBotReasons');
      } catch (error) {
        // ignore
      }
      component.showReasons = true;
      const sessionService = TestBed.inject(SessionService);
      sessionService.set({
        clients: [{ clientId: botClientId, userId: 3 }],
        users: { 3: { userId: 3, name: 'Bot' } }
      } as any);
    });

    it('should mark the bot reason as a "Why?" note', () => {
      setLogs([
        createLog(1, GameLog.LOG_PLAYER_ENDS_TURN, { name: 'Bot' }),
        createLog(2, GameLog.LOG_BOT_REASON, { text: 'Ended the turn without attacking.' })
      ]);

      expect(component.logs.map(l => l.isReason)).toEqual([false, true]);
      expect(component.hasReasons).toBe(true);
      const items: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('li'));
      expect(items.length).toBe(2);
      expect(items[1].classList).toContain('ptcg-game-logs-reason');
      expect(items[1].querySelector('.ptcg-game-logs-reason-label')).not.toBeNull();
    });

    it('should hide and show reasons with the toggle', () => {
      setLogs([createLog(1, GameLog.LOG_BOT_REASON, { text: 'Some reason.' })]);
      const list: HTMLElement = fixture.nativeElement.querySelector('ul');
      expect(list.classList).not.toContain('ptcg-game-logs-hide-reasons');

      component.toggleReasons();
      fixture.detectChanges();
      expect(component.showReasons).toBe(false);
      expect(list.classList).toContain('ptcg-game-logs-hide-reasons');

      component.toggleReasons();
      fixture.detectChanges();
      expect(list.classList).not.toContain('ptcg-game-logs-hide-reasons');
    });

    it('should not show the toggle when there are no reasons', () => {
      setLogs([createLog(1, GameLog.LOG_PLAYER_ENDS_TURN, { name: 'Bot' })]);
      expect(component.hasReasons).toBe(false);
      expect(fixture.nativeElement.querySelector('.ptcg-game-logs-reasons-toggle')).toBeNull();
    });
  });
});
