// Copyright 2025 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for LessonFeedbackModalComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';
import {Directive, Input, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {FeedbackPopupBackendApiService} from '../../../../pages/exploration-player-page/services/feedback-popup-backend-api.service';
import {UserService} from '../../../../services/user.service';
import {PlayerPositionService} from '../../../../pages/exploration-player-page/services/player-position.service';
import {FocusManagerService} from '../../../../services/stateful/focus-manager.service';
import {LessonFeedbackModalComponent} from './lesson-feedback-modal.component';
import {MockTranslatePipe} from '../../../../tests/unit-test-utils';

@Directive({
  selector: '[oppiaFocusOn]',
})
class MockFocusOnDirective {
  @Input() oppiaFocusOn: string = '';
}

describe('LessonFeedbackModalComponent', () => {
  let component: LessonFeedbackModalComponent;
  let fixture: ComponentFixture<LessonFeedbackModalComponent>;

  describe('with MatBottomSheetRef', () => {
    let bottomSheetRef: jasmine.SpyObj<MatBottomSheetRef>;
    let focusManagerService: jasmine.SpyObj<FocusManagerService>;
    let userService: jasmine.SpyObj<UserService>;
    let feedbackPopupBackendApiService: jasmine.SpyObj<FeedbackPopupBackendApiService>;
    let playerPositionService: jasmine.SpyObj<PlayerPositionService>;

    const mockUserInfo = {
      isLoggedIn: () => true,
    };

    const mockUserInfoLoggedOut = {
      isLoggedIn: () => false,
    };

    beforeEach(waitForAsync(() => {
      const bottomSheetRefSpy = jasmine.createSpyObj('MatBottomSheetRef', [
        'dismiss',
      ]);
      const focusManagerSpy = jasmine.createSpyObj('FocusManagerService', [
        'setFocus',
      ]);
      const userServiceSpy = jasmine.createSpyObj('UserService', [
        'getUserInfoAsync',
      ]);
      const feedbackBackendSpy = jasmine.createSpyObj(
        'FeedbackPopupBackendApiService',
        ['submitFeedbackAsync']
      );
      const playerPositionSpy = jasmine.createSpyObj('PlayerPositionService', [
        'getCurrentStateName',
      ]);

      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule, FormsModule],
        declarations: [
          LessonFeedbackModalComponent,
          MockTranslatePipe,
          MockFocusOnDirective,
        ],
        providers: [
          {provide: MatBottomSheetRef, useValue: bottomSheetRefSpy},
          {provide: FocusManagerService, useValue: focusManagerSpy},
          {provide: UserService, useValue: userServiceSpy},
          {provide: PlayerPositionService, useValue: playerPositionSpy},
          {
            provide: FeedbackPopupBackendApiService,
            useValue: feedbackBackendSpy,
          },
        ],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      }).compileComponents();

      bottomSheetRef = TestBed.inject(
        MatBottomSheetRef
      ) as jasmine.SpyObj<MatBottomSheetRef>;
      focusManagerService = TestBed.inject(
        FocusManagerService
      ) as jasmine.SpyObj<FocusManagerService>;
      userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
      feedbackPopupBackendApiService = TestBed.inject(
        FeedbackPopupBackendApiService
      ) as jasmine.SpyObj<FeedbackPopupBackendApiService>;
      playerPositionService = TestBed.inject(
        PlayerPositionService
      ) as jasmine.SpyObj<PlayerPositionService>;
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(LessonFeedbackModalComponent);
      component = fixture.componentInstance;

      userService.getUserInfoAsync.and.returnValue(
        Promise.resolve(mockUserInfo)
      );
      playerPositionService.getCurrentStateName.and.returnValue('test_state');
    });

    it('should create', () => {
      expect(component).toBeDefined();
    });

    it('should initialize component with logged in user', async () => {
      spyOn(Math, 'random').and.returnValue(0.123456789);

      await component.ngOnInit();

      expect(component.isLoggedIn).toBeTrue();
      expect(component.feedbackModalId).toContain('feedbackPopover');
      expect(component.feedbackTitle).toBe(
        'Feedback when the user was at card "test_state"'
      );
      expect(focusManagerService.setFocus).toHaveBeenCalledWith(
        component.feedbackModalId
      );
    });

    it('should initialize component with logged out user', async () => {
      userService.getUserInfoAsync.and.returnValue(
        Promise.resolve(mockUserInfoLoggedOut)
      );

      await component.ngOnInit();

      expect(component.isLoggedIn).toBeFalse();
      expect(focusManagerService.setFocus).toHaveBeenCalled();
    });

    it('should save feedback and show thank you modal when feedback text is provided', () => {
      component.ngOnInit();

      component.feedbackText = 'test feedback';
      component.isLoggedIn = true;
      component.isSubmitterAnonymized = false;
      feedbackPopupBackendApiService.submitFeedbackAsync.and.returnValue(
        Promise.resolve()
      );

      component.saveFeedback();

      expect(
        feedbackPopupBackendApiService.submitFeedbackAsync
      ).toHaveBeenCalledWith(
        component.feedbackTitle,
        'test feedback',
        true,
        'test_state'
      );
      expect(component.thankYouModalIsShown).toBe(true);
    });

    it('should save feedback anonymously when user is logged in but anonymized', () => {
      component.ngOnInit();

      component.feedbackText = 'test feedback';
      component.isLoggedIn = true;
      component.isSubmitterAnonymized = true;
      feedbackPopupBackendApiService.submitFeedbackAsync.and.returnValue(
        Promise.resolve()
      );

      component.saveFeedback();

      expect(
        feedbackPopupBackendApiService.submitFeedbackAsync
      ).toHaveBeenCalledWith(
        component.feedbackTitle,
        'test feedback',
        false,
        'test_state'
      );
      expect(component.thankYouModalIsShown).toBe(true);
    });

    it('should save feedback anonymously when user is logged out', () => {
      component.ngOnInit();

      component.feedbackText = 'test feedback';
      component.isLoggedIn = false;
      component.isSubmitterAnonymized = false;
      feedbackPopupBackendApiService.submitFeedbackAsync.and.returnValue(
        Promise.resolve()
      );

      component.saveFeedback();

      expect(
        feedbackPopupBackendApiService.submitFeedbackAsync
      ).toHaveBeenCalledWith(
        component.feedbackTitle,
        'test feedback',
        false,
        'test_state'
      );
      expect(component.thankYouModalIsShown).toBe(true);
    });

    it('should show thank you modal without saving when feedback text is empty', () => {
      component.ngOnInit();

      component.feedbackText = '';

      component.saveFeedback();

      expect(
        feedbackPopupBackendApiService.submitFeedbackAsync
      ).not.toHaveBeenCalled();
      expect(component.thankYouModalIsShown).toBe(true);
    });

    it('should show thank you modal without saving when feedback text is null', () => {
      component.ngOnInit();

      const nullValue: string = null as unknown as string;
      component.feedbackText = nullValue;

      component.saveFeedback();

      expect(
        feedbackPopupBackendApiService.submitFeedbackAsync
      ).not.toHaveBeenCalled();
      expect(component.thankYouModalIsShown).toBe(true);
    });

    it('should close modal with MatBottomSheetRef', () => {
      component.closeModal();

      expect(bottomSheetRef.dismiss).toHaveBeenCalledWith('cancel');
    });
  });

  describe('with NgbActiveModal', () => {
    let ngbActiveModal: jasmine.SpyObj<NgbActiveModal>;
    let userService: jasmine.SpyObj<UserService>;
    let playerPositionService: jasmine.SpyObj<PlayerPositionService>;

    const mockUserInfo = {
      isLoggedIn: () => true,
    };

    beforeEach(waitForAsync(() => {
      const ngbActiveModalSpy = jasmine.createSpyObj('NgbActiveModal', [
        'dismiss',
      ]);
      const focusManagerSpy = jasmine.createSpyObj('FocusManagerService', [
        'setFocus',
      ]);
      const userServiceSpy = jasmine.createSpyObj('UserService', [
        'getUserInfoAsync',
      ]);
      const feedbackBackendSpy = jasmine.createSpyObj(
        'FeedbackPopupBackendApiService',
        ['submitFeedbackAsync']
      );
      const playerPositionSpy = jasmine.createSpyObj('PlayerPositionService', [
        'getCurrentStateName',
      ]);

      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule, FormsModule],
        declarations: [
          LessonFeedbackModalComponent,
          MockTranslatePipe,
          MockFocusOnDirective,
        ],
        providers: [
          {provide: NgbActiveModal, useValue: ngbActiveModalSpy},
          {provide: FocusManagerService, useValue: focusManagerSpy},
          {provide: UserService, useValue: userServiceSpy},
          {provide: PlayerPositionService, useValue: playerPositionSpy},
          {
            provide: FeedbackPopupBackendApiService,
            useValue: feedbackBackendSpy,
          },
        ],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      }).compileComponents();

      ngbActiveModal = TestBed.inject(
        NgbActiveModal
      ) as jasmine.SpyObj<NgbActiveModal>;
      userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
      playerPositionService = TestBed.inject(
        PlayerPositionService
      ) as jasmine.SpyObj<PlayerPositionService>;
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(LessonFeedbackModalComponent);
      component = fixture.componentInstance;

      userService.getUserInfoAsync.and.returnValue(
        Promise.resolve(mockUserInfo)
      );
      playerPositionService.getCurrentStateName.and.returnValue('test_state');
    });

    it('should create', () => {
      expect(component).toBeDefined();
    });

    it('should close modal with NgbActiveModal when bottomSheetRef is not available', () => {
      component.closeModal();

      expect(ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
    });
  });

  describe('without any modal services', () => {
    let userService: jasmine.SpyObj<UserService>;
    let playerPositionService: jasmine.SpyObj<PlayerPositionService>;

    const mockUserInfo = {
      isLoggedIn: () => true,
    };

    beforeEach(waitForAsync(() => {
      const focusManagerSpy = jasmine.createSpyObj('FocusManagerService', [
        'setFocus',
      ]);
      const userServiceSpy = jasmine.createSpyObj('UserService', [
        'getUserInfoAsync',
      ]);
      const feedbackBackendSpy = jasmine.createSpyObj(
        'FeedbackPopupBackendApiService',
        ['submitFeedbackAsync']
      );
      const playerPositionSpy = jasmine.createSpyObj('PlayerPositionService', [
        'getCurrentStateName',
      ]);

      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule, FormsModule],
        declarations: [
          LessonFeedbackModalComponent,
          MockTranslatePipe,
          MockFocusOnDirective,
        ],
        providers: [
          {provide: FocusManagerService, useValue: focusManagerSpy},
          {provide: UserService, useValue: userServiceSpy},
          {provide: PlayerPositionService, useValue: playerPositionSpy},
          {
            provide: FeedbackPopupBackendApiService,
            useValue: feedbackBackendSpy,
          },
        ],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      }).compileComponents();

      userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
      playerPositionService = TestBed.inject(
        PlayerPositionService
      ) as jasmine.SpyObj<PlayerPositionService>;
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(LessonFeedbackModalComponent);
      component = fixture.componentInstance;

      userService.getUserInfoAsync.and.returnValue(
        Promise.resolve(mockUserInfo)
      );
      playerPositionService.getCurrentStateName.and.returnValue('test_state');
    });

    it('should create', () => {
      expect(component).toBeDefined();
    });

    it('should not throw error when closeModal is called without modal services', () => {
      expect(() => {
        component.closeModal();
      }).not.toThrowError();
    });
  });
});
