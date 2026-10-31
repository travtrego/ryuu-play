import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { AlertService } from '../shared/alert/alert.service';
import { ApiError } from '../api/api.error';
import { ApiErrorEnum } from '@ptcg/common';
import { DeckService } from '../api/services/deck.service';
import { GamesComponent } from './games.component';
import { MainService } from '../api/services/main.service';
import { SessionService } from '../shared/session/session.service';

describe('GamesComponent', () => {
  let component: GamesComponent;
  let fixture: ComponentFixture<GamesComponent>;
  let mainService: jasmine.SpyObj<MainService>;
  let alertService: jasmine.SpyObj<AlertService>;
  let deckService: jasmine.SpyObj<DeckService>;

  beforeEach(waitForAsync(() => {
    mainService = jasmine.createSpyObj('MainService', ['createGame', 'createGuidedGame']);
    alertService = jasmine.createSpyObj('AlertService', ['toast', 'alert']);
    deckService = jasmine.createSpyObj('DeckService', ['getList', 'getDeck']);
    const sessionService = {
      get: () => of([{}, []])
    };

    TestBed.configureTestingModule({
      imports: [ MatTooltipModule, TranslateModule.forRoot() ],
      declarations: [ GamesComponent ],
      providers: [
        { provide: AlertService, useValue: alertService },
        { provide: DeckService, useValue: deckService },
        { provide: MatDialog, useValue: {} },
        { provide: MainService, useValue: mainService },
        { provide: SessionService, useValue: sessionService }
      ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GamesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function guidedButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.ptcg-guided-game-button');
  }

  it('should show a guided first game button', () => {
    expect(guidedButton()).not.toBeNull();
    expect(guidedButton().textContent).toContain('GAMES_GUIDED_GAME_BUTTON');
  });

  it('should start a guided game without asking for a deck', () => {
    mainService.createGuidedGame.and.returnValue(of({}));
    guidedButton().click();

    expect(mainService.createGuidedGame).toHaveBeenCalledTimes(1);
    expect(deckService.getList).not.toHaveBeenCalled();
    expect(mainService.createGame).not.toHaveBeenCalled();
    expect(component.loading).toBe(false);
  });

  it('should explain when no bot is online', () => {
    mainService.createGuidedGame.and.returnValue(
      throwError(() => new ApiError(ApiErrorEnum.SOCKET_ERROR, 'ERROR_BOT_NOT_FOUND')));
    guidedButton().click();

    expect(alertService.toast).toHaveBeenCalledWith('GAMES_GUIDED_NO_BOT');
    expect(component.loading).toBe(false);
  });

  it('should show a generic error otherwise', () => {
    mainService.createGuidedGame.and.returnValue(
      throwError(() => new ApiError(ApiErrorEnum.SOCKET_ERROR, 'SOMETHING_ELSE')));
    guidedButton().click();

    expect(alertService.toast).toHaveBeenCalledWith('ERROR_UNKNOWN');
  });
});
