import { Component, Input, ElementRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { GameLog as GameLogMessage, StateLog, StateLogParam } from '@ptcg/common';

import { GameService } from '../../../api/services/game.service';
import { LocalGameState } from '../../../shared/session/session.interface';
import { SessionService } from '../../../shared/session/session.service';

interface GameLog {
  id: number;
  name: string;
  className: string;
  message: string;
  params: StateLogParam;
  /** Learn mode: the bot's explanation of its previous move. */
  isReason: boolean;
}

const SHOW_REASONS_STORAGE_KEY = 'ptcgShowBotReasons';

@Component({
  selector: 'ptcg-game-logs',
  templateUrl: './game-logs.component.html',
  styleUrls: ['./game-logs.component.scss']
})
export class GameLogsComponent {

  // bot explanations add roughly one entry per bot move, so keep more
  private readonly LOG_COUNT_LIMIT = 100;

  public loading = true;
  public logs: GameLog[] = [];
  public message = '';
  public isDeleted: boolean;
  public hasReasons = false;
  public showReasons = GameLogsComponent.loadShowReasons();
  private state: LocalGameState;

  @Input() set gameState(gameState: LocalGameState) {
    if (!gameState || !gameState.state) {
      this.logs = [];
      return;
    }
    if (this.state && this.state.localId !== gameState.localId) {
      this.logs = [];
    }
    this.state = gameState;
    this.isDeleted = gameState.deleted;
    this.appendLogs(gameState.logs);
  }

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private gameService: GameService,
    private sessionService: SessionService,
    private translate: TranslateService
  ) { }

  public clearLogs() {
    this.state.logs = [];
    this.logs = [];
  }

  public toggleReasons() {
    this.showReasons = !this.showReasons;
    try {
      window.localStorage.setItem(SHOW_REASONS_STORAGE_KEY, this.showReasons ? '1' : '0');
    } catch (error) {
      // storage unavailable, keep the choice for this session only
    }
    if (this.showReasons) {
      this.scrollToBottom();
    }
  }

  private static loadShowReasons(): boolean {
    try {
      return window.localStorage.getItem(SHOW_REASONS_STORAGE_KEY) !== '0';
    } catch (error) {
      return true;
    }
  }

  public sendMessage() {
    const message = (this.message || '').trim();
    if (!this.state || message.length === 0) {
      return;
    }
    this.gameService.appendLogAction(this.state.gameId, message);
    this.message = '';
  }

  public trackByFn(log: GameLog) {
    return log.id;
  }

  private appendLogs(logs: StateLog[]) {
    if (logs.length === 0 || !this.state) {
      return;
    }

    // delete future logs (when user rewind state in replays)
    let maxLogId = 0;
    logs.forEach(log => { maxLogId = Math.max(log.id, maxLogId); });
    this.logs = this.logs.filter(log => log.id <= maxLogId);

    let logsAdded = false;

    // Append logs, skip the existing one
    logs.forEach(log => {
      if (this.logs.find(log2 => log2.id === log.id) === undefined) {
        const gameLog = this.buildGameLog(log);
        if (gameLog !== undefined) {
          this.logs.push(gameLog);
          logsAdded = true;
        }
      }
    });

    this.hasReasons = this.logs.some(log => log.isReason);

    if (!logsAdded) {
      return;
    }

    // Sort logs by their id
    this.logs.sort((a, b) => a.id - b.id);

    // Remove logs over the limit
    if (this.logs.length > this.LOG_COUNT_LIMIT) {
      const toDelete = this.logs.length - this.LOG_COUNT_LIMIT;
      this.logs.splice(0, toDelete);
      this.hasReasons = this.logs.some(log => log.isReason);
    }

    this.scrollToBottom();
  }

  private buildGameLog(log: StateLog): GameLog | undefined {
    let name: string;
    let className: string;
    const isReason = log.message === GameLogMessage.LOG_BOT_REASON;

    const client = this.sessionService.session.clients.find(c => c.clientId === log.client);
    const user = client ? this.sessionService.session.users[client.userId] : undefined;
    const playerIndex = this.state.state.players.findIndex(p => p.id === log.client);

    // translate log messages
    if (log.params.message) {
      log.params.message = this.translate.instant('GAME_MESSAGES.' + log.params.message);
    }

    if (user !== undefined) {
      name = user.name;
      className = playerIndex >= 0
        ? `ptcg-player${playerIndex + 1}`
        : 'ptcg-spectator';
      return {
        id: log.id,
        name,
        className,
        message: log.message,
        params: log.params,
        isReason
      };
    } else if (log.client === 0) {
      return {
        id: log.id,
        name: 'System',
        className: 'ptcg-system',
        message: log.message,
        params: log.params,
        isReason
      };
    }
    return undefined;
  }

  private scrollToBottom(): void {
    try {
      const scollablePane = this.elementRef.nativeElement
        .getElementsByClassName('ptcg-game-logs-content')[0] as HTMLElement;
      setTimeout(() => {
        scollablePane.scrollTop = scollablePane.scrollHeight;
      });
    } catch (err) {
      // Ignore errors
    }
  }

}
