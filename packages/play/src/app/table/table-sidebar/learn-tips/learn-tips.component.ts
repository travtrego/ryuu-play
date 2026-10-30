import { Component, Input, OnChanges } from '@angular/core';

import { LearnTip, getLearnTips } from './learn-tips';
import { LocalGameState } from '../../../shared/session/session.interface';

const SHOW_TIPS_STORAGE_KEY = 'ptcgShowLearnTips';

/**
 * Learn mode: shows a short tip about the current situation at the table, with a
 * "Learn more" link to the matching section of the "How to play" page.
 * The link opens in a new tab so the game stays on screen.
 */
@Component({
  selector: 'ptcg-learn-tips',
  templateUrl: './learn-tips.component.html',
  styleUrls: ['./learn-tips.component.scss']
})
export class LearnTipsComponent implements OnChanges {

  @Input() gameState: LocalGameState;
  @Input() clientId: number;

  public tips: LearnTip[] = [];
  public showTips = LearnTipsComponent.loadShowTips();

  ngOnChanges(): void {
    if (!this.gameState || this.gameState.replay !== undefined || this.gameState.deleted) {
      this.tips = [];
      return;
    }
    this.tips = getLearnTips(this.gameState.state, this.clientId);
  }

  public toggleTips(): void {
    this.showTips = !this.showTips;
    try {
      window.localStorage.setItem(SHOW_TIPS_STORAGE_KEY, this.showTips ? '1' : '0');
    } catch (error) {
      // storage unavailable, keep the choice for this session only
    }
  }

  public trackById(index: number, tip: LearnTip): string {
    return tip.id;
  }

  private static loadShowTips(): boolean {
    try {
      return window.localStorage.getItem(SHOW_TIPS_STORAGE_KEY) !== '0';
    } catch (error) {
      return true;
    }
  }

}
