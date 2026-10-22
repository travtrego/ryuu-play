import { Component } from '@angular/core';

export interface RulesSection {
  id: string;
  title: string;
}

/**
 * Learn mode v1: a plain-language rules reference.
 *
 * The content describes the rules this simulator actually enforces (see packages/common:
 * game-phase-effect, game-effect, play-card-reducer, retreat-effect, setup-reducer), so it
 * stays true to what the player sees at the table. Keep it in sync if those rules change.
 */
@Component({
  selector: 'ptcg-rules',
  templateUrl: './rules.component.html',
  styleUrls: ['./rules.component.scss']
})
export class RulesComponent {

  public sections: RulesSection[] = [
    { id: 'goal', title: 'How to win' },
    { id: 'setup', title: 'Setting up' },
    { id: 'turn', title: 'Your turn' },
    { id: 'energy', title: 'Energy and attacking' },
    { id: 'evolve', title: 'Evolving' },
    { id: 'retreat', title: 'Retreating' },
    { id: 'damage', title: 'Damage, Weakness and Resistance' },
    { id: 'conditions', title: 'Special Conditions' },
    { id: 'trainers', title: 'Trainer cards' },
    { id: 'tips', title: 'Beginner tips' },
  ];

  public scrollTo(id: string): void {
    const element = document.getElementById('rules-' + id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
