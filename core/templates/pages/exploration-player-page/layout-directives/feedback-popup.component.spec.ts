// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for FeedbackPopupComponent
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {TranslateService} from '@ngx-translate/core';
import {MockTranslateService} from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {FeedbackPopupComponent} from './feedback-popup.component';
import {UserService} from 'services/user.service';
import {UserInfo} from 'domain/user/user-info.model';
import {PlayerPositionService} from '../services/player-position.service';
import {BackgroundMaskService} from 'services/stateful/background-mask.service';
import {FeedbackPopupBackendApiService} from '../services/feedback-popup-backend-api.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('FeedbackPopupComponent', () => {
  let component: FeedbackPopupComponent;
  let fixture: ComponentFixture<FeedbackPopupComponent>;
  let userService: UserService;
  let playerPositionService: PlayerPositionService;
  let windowDimensionsService: WindowDimensionsService;
  let feedbackPopupBackendApiService: FeedbackPopupBackendApiService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [FeedbackPopupComponent, MockTranslatePipe],
      providers: [
        BackgroundMaskService,
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    userService = TestBed.get(UserService);
    playerPositionService = TestBed.get(PlayerPositionService);
    windowDimensionsService = TestBed.get(WindowDimensionsService);
    feedbackPopupBackendApiService = TestBed.get(
      FeedbackPopupBackendApiService
    );
    fixture = TestBed.createComponent(FeedbackPopupComponent);
    component = fixture.componentInstance;

    spyOn(userService, 'getUserInfoAsync').and.resolveTo({
      isLoggedIn: () => true,
    } as UserInfo);
    spyOn(playerPositionService, 'getCurrentStateName').and.returnValue('Hola');
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(true);
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should set component properties on initialization', fakeAsync(() => {
    expect(component.isLoggedIn).toBeFalse();
    expect(component.feedbackPopoverId).toBeUndefined();
    expect(component.feedbackTitle).toBeUndefined();

    component.ngOnInit();
    tick();

    expect(component.isLoggedIn).toBe(true);
    expect(component.feedbackPopoverId).toContain('feedbackPopover');
    expect(component.feedbackTitle).toBe(
      'Feedback when the user was at card "Hola"'
    );
  }));

  it('should save feedback submitted by user', fakeAsync(() => {
    component.feedbackText = 'Nice exploration!';
    spyOn(
      feedbackPopupBackendApiService,
      'submitFeedbackAsync'
    ).and.resolveTo();
    spyOn(component.closePopover, 'emit');

    expect(component.feedbackSubmitted).toBe(false);

    component.saveFeedback();
    tick(3001);

    expect(component.feedbackSubmitted).toBe(true);
    expect(component.closePopover.emit).toHaveBeenCalled();
  }));
});
