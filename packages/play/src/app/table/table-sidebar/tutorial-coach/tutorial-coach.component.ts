import { Component, Input, OnChanges } from '@angular/core';

import { GameService } from '../../../api/services/game.service';
import { LocalGameState } from '../../../shared/session/session.interface';
import { TutorialCoach, TutorialView } from './tutorial-coach';

/**
 * Learn mode: the coach panel of a tutorial game. Shows the current lesson
 * (what to do, or something to read with a "Got it" button) and why the last
 * lesson mattered, each with a "Learn more" link to the "How to play" page.
 * Shown only in tutorial games (`state.rules.tutorial`), only to the player.
 *
 * On the bot's turn it also shows a Continue button: in a tutorial game the
 * bot waits for it before each move (the server's BotPacer). When the last
 * lesson is done it tells the server to stop waiting, so the rest of the game
 * plays at normal speed.
 */
@Component({
  selector: 'ptcg-tutorial-coach',
  templateUrl: './tutorial-coach.component.html',
  styleUrls: ['./tutorial-coach.component.scss']
})
export class TutorialCoachComponent implements OnChanges {

  @Input() gameState: LocalGameState;
  @Input() clientId: number;

  public view: TutorialView | undefined;

  private coach: TutorialCoach | undefined;
  private coachGameId: number | undefined;
  private releasedGameId: number | undefined;

  constructor(private gameService: GameService) { }

  ngOnChanges(): void {
    this.refresh();
  }

  public acknowledge(id: string): void {
    if (this.coach !== undefined) {
      this.coach.acknowledge(id);
      this.refresh();
    }
  }

  /** Let the waiting bot make its next move. */
  public continueBot(): void {
    if (this.gameState) {
      this.gameService.botContinueAction(this.gameState.gameId);
    }
  }

  private refresh(): void {
    const gameState = this.gameState;
    if (!gameState || gameState.replay !== undefined || gameState.deleted
      || !gameState.state || !gameState.state.rules.tutorial) {
      this.view = undefined;
      return;
    }
    // One coach per game, so switching tables never carries lessons across.
    if (this.coach === undefined || this.coachGameId !== gameState.localId) {
      this.coach = new TutorialCoach();
      this.coachGameId = gameState.localId;
    }
    this.view = this.coach.update(gameState.state, this.clientId);
    if (this.view.finished && this.releasedGameId !== gameState.localId) {
      this.releasedGameId = gameState.localId;
      this.gameService.botContinueAction(gameState.gameId, true);
    }
  }

}
