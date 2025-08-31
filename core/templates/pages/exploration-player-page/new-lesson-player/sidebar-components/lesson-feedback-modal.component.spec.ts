// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for LessonFeedbackModalComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';
import {Directive, Input} from '@angular/core';
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
  let ngbActiveModal: NgbActiveModal;
  let bottomSheetRef: MatBottomSheetRef;
  let focusManagerService: FocusManagerService;
  let userService: UserService;
  let feedbackPopupBackendApiService: FeedbackPopupBackendApiService;

  const mockUserInfo = {
    isLoggedIn: () => true,
  };

  const mockUserInfoLoggedOut = {
    isLoggedIn: () => false,
  };

  class MockUserService {
    getUserInfoAsync(): Promise<typeof mockUserInfo> {
      return Promise.resolve(mockUserInfo);
    }
  }

  class MockPlayerPositionService {
    getCurrentStateName(): string {
      return 'test_state';
    }
  }

  class MockFocusManagerService {
    setFocus(elementId: string): void {}
  }

  class MockFeedbackPopupBackendApiService {
    submitFeedbackAsync(
      title: string,
      text: string,
      includeAuthor: boolean,
      state: string
    ): Promise<void> {
      return Promise.resolve();
    }
  }

  class MockMatBottomSheetRef {
    dismiss(): void {}
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule],
      declarations: [
        LessonFeedbackModalComponent,
        MockTranslatePipe,
        MockFocusOnDirective,
      ],
      providers: [
        NgbActiveModal,
        {
          provide: FocusManagerService,
          useClass: MockFocusManagerService,
        },
        {
          provide: UserService,
          useClass: MockUserService,
        },
        {
          provide: PlayerPositionService,
          useClass: MockPlayerPositionService,
        },
        {
          provide: FeedbackPopupBackendApiService,
          useClass: MockFeedbackPopupBackendApiService,
        },
        {
          provide: MatBottomSheetRef,
          useClass: MockMatBottomSheetRef,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LessonFeedbackModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    bottomSheetRef = TestBed.inject(MatBottomSheetRef);
    focusManagerService = TestBed.inject(FocusManagerService);
    userService = TestBed.inject(UserService);
    feedbackPopupBackendApiService = TestBed.inject(
      FeedbackPopupBackendApiService
    );
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should initialize component with logged in user', async () => {
    spyOn(focusManagerService, 'setFocus');
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
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(mockUserInfoLoggedOut)
    );
    spyOn(focusManagerService, 'setFocus');

    await component.ngOnInit();

    expect(component.isLoggedIn).toBeFalse();
    expect(focusManagerService.setFocus).toHaveBeenCalled();
  });

  it('should save feedback with NgbActiveModal when user is logged in and not anonymized', async () => {
    component.feedbackText = 'test feedback';
    component.isLoggedIn = true;
    component.isSubmitterAnonymized = false;
    // Ensure bottomSheetRef is null so ngbActiveModal is used.
    const componentRef = component as unknown as {
      bottomSheetRef: MatBottomSheetRef | null;
    };
    componentRef.bottomSheetRef = null;

    spyOn(
      feedbackPopupBackendApiService,
      'submitFeedbackAsync'
    ).and.returnValue(Promise.resolve());
    spyOn(ngbActiveModal, 'close');

    await component.saveFeedback();

    expect(
      feedbackPopupBackendApiService.submitFeedbackAsync
    ).toHaveBeenCalledWith(
      component.feedbackTitle,
      'test feedback',
      true,
      'test_state'
    );
    expect(ngbActiveModal.close).toHaveBeenCalled();
  });

  it('should save feedback with MatBottomSheetRef when user is logged in and not anonymized', async () => {
    component.feedbackText = 'test feedback';
    component.isLoggedIn = true;
    component.isSubmitterAnonymized = false;
    // Mock the component to use bottomSheetRef instead of ngbActiveModal.
    const componentRef = component as unknown as {
      ngbActiveModal: NgbActiveModal | null;
    };
    componentRef.ngbActiveModal = null;

    spyOn(
      feedbackPopupBackendApiService,
      'submitFeedbackAsync'
    ).and.returnValue(Promise.resolve());
    spyOn(bottomSheetRef, 'dismiss');

    await component.saveFeedback();

    expect(
      feedbackPopupBackendApiService.submitFeedbackAsync
    ).toHaveBeenCalledWith(
      component.feedbackTitle,
      'test feedback',
      true,
      'test_state'
    );
    expect(bottomSheetRef.dismiss).toHaveBeenCalled();
  });

  it('should save feedback anonymously when user is logged in but anonymized', async () => {
    component.feedbackText = 'test feedback';
    component.isLoggedIn = true;
    component.isSubmitterAnonymized = true;
    const componentRef = component as unknown as {
      bottomSheetRef: MatBottomSheetRef | null;
    };
    componentRef.bottomSheetRef = null;

    spyOn(
      feedbackPopupBackendApiService,
      'submitFeedbackAsync'
    ).and.returnValue(Promise.resolve());
    spyOn(ngbActiveModal, 'close');

    await component.saveFeedback();

    expect(
      feedbackPopupBackendApiService.submitFeedbackAsync
    ).toHaveBeenCalledWith(
      component.feedbackTitle,
      'test feedback',
      false,
      'test_state'
    );
  });

  it('should save feedback anonymously when user is logged out', async () => {
    component.feedbackText = 'test feedback';
    component.isLoggedIn = false;
    component.isSubmitterAnonymized = false;
    const componentRef = component as unknown as {
      bottomSheetRef: MatBottomSheetRef | null;
    };
    componentRef.bottomSheetRef = null;

    spyOn(
      feedbackPopupBackendApiService,
      'submitFeedbackAsync'
    ).and.returnValue(Promise.resolve());
    spyOn(ngbActiveModal, 'close');

    await component.saveFeedback();

    expect(
      feedbackPopupBackendApiService.submitFeedbackAsync
    ).toHaveBeenCalledWith(
      component.feedbackTitle,
      'test feedback',
      false,
      'test_state'
    );
  });

  it('should not save feedback when feedback text is empty', () => {
    component.feedbackText = '';

    spyOn(feedbackPopupBackendApiService, 'submitFeedbackAsync');
    spyOn(ngbActiveModal, 'close');
    spyOn(bottomSheetRef, 'dismiss');

    component.saveFeedback();

    expect(
      feedbackPopupBackendApiService.submitFeedbackAsync
    ).not.toHaveBeenCalled();
    expect(ngbActiveModal.close).toHaveBeenCalled();
    expect(bottomSheetRef.dismiss).not.toHaveBeenCalled();
  });

  it('should not save feedback when feedback text is null', () => {
    const nullValue: string = null as unknown as string;
    component.feedbackText = nullValue;

    spyOn(feedbackPopupBackendApiService, 'submitFeedbackAsync');
    spyOn(ngbActiveModal, 'close');
    spyOn(bottomSheetRef, 'dismiss');

    component.saveFeedback();

    expect(
      feedbackPopupBackendApiService.submitFeedbackAsync
    ).not.toHaveBeenCalled();
    expect(ngbActiveModal.close).toHaveBeenCalled();
    expect(bottomSheetRef.dismiss).not.toHaveBeenCalled();
  });

  it('should close modal with MatBottomSheetRef', () => {
    spyOn(bottomSheetRef, 'dismiss');

    component.closeModal();

    expect(bottomSheetRef.dismiss).toHaveBeenCalledWith('cancel');
  });

  it('should close modal with NgbActiveModal when bottomSheetRef is not available', () => {
    // Mock the component to use ngbActiveModal instead of bottomSheetRef.
    const componentRef = component as unknown as {
      bottomSheetRef: MatBottomSheetRef | null;
    };
    componentRef.bottomSheetRef = null;
    spyOn(ngbActiveModal, 'dismiss');

    component.closeModal();

    expect(ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
  });
});
