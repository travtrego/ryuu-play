import { AfterViewInit, Component, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface RulesSection {
  id: string;
  title: string;
}

/** Sections of the rules page, in page order. Ids match the `rules-<id>` anchors in the template. */
export const RULES_SECTIONS: RulesSection[] = [
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

/**
 * Learn mode v1: a plain-language rules reference.
 *
 * The content describes the rules this simulator actually enforces (see packages/common:
 * game-phase-effect, game-effect, play-card-reducer, retreat-effect, setup-reducer), so it
 * stays true to what the player sees at the table. Keep it in sync if those rules change.
 *
 * Links from the table (learn tips) open /rules#<section id>; the page scrolls to that section.
 */
@Component({
  selector: 'ptcg-rules',
  templateUrl: './rules.component.html',
  styleUrls: ['./rules.component.scss']
})
export class RulesComponent implements AfterViewInit {

  public sections: RulesSection[] = RULES_SECTIONS;

  private destroyRef = inject(DestroyRef);

  constructor(private route: ActivatedRoute) { }

  ngAfterViewInit(): void {
    this.route.fragment.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(fragment => {
      if (fragment && this.sections.some(section => section.id === fragment)) {
        // Wait for the content to render before scrolling.
        window.setTimeout(() => this.scrollTo(fragment));
      }
    });
  }

  public scrollTo(id: string): void {
    const element = document.getElementById('rules-' + id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
