import { Component, Input, OnChanges } from '@angular/core';
import { CoachAdvice } from '@ptcg/common';

import { GameService } from '../../../api/services/game.service';
import { LocalGameState } from '../../../shared/session/session.interface';

@Component({
  selector: 'ptcg-coach-panel',
  templateUrl: './coach-panel.component.html',
  styleUrls: ['./coach-panel.component.scss']
})
export class CoachPanelComponent implements OnChanges {

  @Input() gameState: LocalGameState;

  public enabled = false;
  public loading = false;
  public advice: CoachAdvice | null = null;
  public error: string | undefined;
  public showAlternatives = false;

  constructor(private gameService: GameService) { }

  public ngOnChanges() {
    // The board moved on, so any advice on screen is about a position that no
    // longer exists. Stale advice is worse than none.
    this.advice = null;
    this.error = undefined;
    this.showAlternatives = false;

    if (this.enabled) {
      this.refresh();
    }
  }

  public toggle() {
    this.enabled = !this.enabled;
    this.advice = null;
    this.error = undefined;

    if (this.enabled) {
      this.refresh();
    }
  }

  public refresh() {
    if (!this.gameState || !this.gameState.gameId || this.loading) {
      return;
    }

    this.loading = true;
    this.error = undefined;

    this.gameService.getCoachAdvice(this.gameState.gameId)
      .subscribe(
        advice => {
          this.advice = advice;
          this.loading = false;
        },
        () => {
          // A coach that cannot answer is a degraded feature, not a broken
          // game - the board stays playable either way.
          this.error = 'COACH_UNAVAILABLE';
          this.loading = false;
        }
      );
  }

}
