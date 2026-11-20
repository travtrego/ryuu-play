import { Component, Input, OnChanges } from '@angular/core';

import { GameRecap, RecapLine, getGameRecap } from './game-recap';
import { LocalGameState } from '../../../shared/session/session.interface';

/**
 * Learn mode: after the game, a short recap of how it ended (the Prize race and the
 * Knock Outs) with one or two rule reminders, each linking to the "How to play" page.
 * Shown only to the players of a finished live game, not in replays.
 */
@Component({
  selector: 'ptcg-game-recap',
  templateUrl: './game-recap.component.html',
  styleUrls: ['./game-recap.component.scss']
})
export class GameRecapComponent implements OnChanges {

  @Input() gameState: LocalGameState;
  @Input() clientId: number;

  public recap: GameRecap | undefined;

  ngOnChanges(): void {
    if (!this.gameState || this.gameState.replay !== undefined) {
      this.recap = undefined;
      return;
    }
    this.recap = getGameRecap(this.gameState.state, this.gameState.logs || [], this.clientId);
  }

  public trackById(index: number, line: RecapLine): string {
    return line.id;
  }

}
