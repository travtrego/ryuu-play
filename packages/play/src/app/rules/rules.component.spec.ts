import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

import { RULES_SECTIONS, RulesComponent } from './rules.component';

describe('RulesComponent', () => {
  let fixture: ComponentFixture<RulesComponent>;
  let fragment: BehaviorSubject<string | null>;

  function create(initial: string | null) {
    fragment = new BehaviorSubject<string | null>(initial);
    TestBed.configureTestingModule({
      imports: [ TranslateModule.forRoot() ],
      declarations: [ RulesComponent ],
      providers: [ { provide: ActivatedRoute, useValue: { fragment } } ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
    });
    fixture = TestBed.createComponent(RulesComponent);
  }

  it('has an anchor for every section', () => {
    create(null);
    fixture.detectChanges();
    RULES_SECTIONS.forEach(section => {
      expect(fixture.nativeElement.querySelector('#rules-' + section.id)).withContext(section.id).not.toBeNull();
    });
  });

  it('scrolls to the section named in the URL fragment', fakeAsync(() => {
    create('conditions');
    const scrollTo = spyOn(fixture.componentInstance, 'scrollTo');
    fixture.detectChanges();
    tick();
    expect(scrollTo).toHaveBeenCalledWith('conditions');
  }));

  it('ignores unknown fragments', fakeAsync(() => {
    create('nope');
    const scrollTo = spyOn(fixture.componentInstance, 'scrollTo');
    fixture.detectChanges();
    tick();
    expect(scrollTo).not.toHaveBeenCalled();
  }));
});
