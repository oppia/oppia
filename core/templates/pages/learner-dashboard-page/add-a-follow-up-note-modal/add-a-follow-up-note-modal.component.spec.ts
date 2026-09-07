// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for add a follow up note modal.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {FormsModule} from '@angular/forms';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  waitForAsync,
  tick,
} from '@angular/core/testing';
import {AddAFollowUpNoteModalComponent} from './add-a-follow-up-note-modal.component';
import {AlertsService} from 'services/alerts.service';
import {FeedbackBackendApiService} from 'domain/feedback/feedback-backend-api.service';
import {
  FeedbackStatus,
  LessonFeedbackDetailResponse,
} from 'domain/feedback/feedback.model';

describe('AddAFollowUpNoteModalComponent', () => {
  let component: AddAFollowUpNoteModalComponent;
  let fixture: ComponentFixture<AddAFollowUpNoteModalComponent>;
  let alertsService: AlertsService;
  let feedbackBackendApiService: FeedbackBackendApiService;
  let ngbActiveModal: NgbActiveModal;
  let detailFeedback: LessonFeedbackDetailResponse;
  let feedbackBackendApiSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule],
      declarations: [AddAFollowUpNoteModalComponent, MockTranslatePipe],
      providers: [AlertsService, FeedbackBackendApiService, NgbActiveModal],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddAFollowUpNoteModalComponent);
    component = fixture.componentInstance;
    alertsService = TestBed.inject(AlertsService);
    feedbackBackendApiService = TestBed.inject(FeedbackBackendApiService);
    ngbActiveModal = TestBed.inject(NgbActiveModal);

    feedbackBackendApiSpy = spyOn(
      feedbackBackendApiService,
      'submitMyFeedbackFollowUpAsync'
    );
    spyOn(alertsService, 'addSuccessMessage');
    spyOn(alertsService, 'addWarning');
    spyOn(ngbActiveModal, 'dismiss').and.callThrough();

    detailFeedback = {
      id: 'test_report_id',
      feedback_text: 'Test report',
      status: FeedbackStatus.OPEN,
      lesson_metadata: {
        exploration_id: 'test',
        exploration_version: 1,
        state_name: 'intro',
        state_index: 1,
        learner_current_answer: 'test',
      },
      parent_feedback_id: null,
      response_list: [],
      unread_response_count: 0,
      created_on_msecs: 123456,
    };

    component.detailFeedback = detailFeedback;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.detailFeedback).toEqual(detailFeedback);
    expect(component.followUpText).toEqual('');
  });

  it('should submit successfully', fakeAsync(() => {
    feedbackBackendApiSpy.and.returnValue(
      Promise.resolve({
        success: true,
      })
    );
    component.followUpText = 'test';
    component.submit();
    tick();

    expect(
      feedbackBackendApiService.submitMyFeedbackFollowUpAsync
    ).toHaveBeenCalled();
    expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
      'Your follow up note has been sent successfully',
      7000,
      true
    );
    expect(ngbActiveModal.dismiss).toHaveBeenCalled();
    expect(component.followUpText).toEqual('');
    expect(component.isSubmittingFollowUp).toEqual(false);
  }));

  it('should fail to submit', fakeAsync(() => {
    feedbackBackendApiSpy.and.returnValue(Promise.reject());
    component.followUpText = 'test';
    component.submit();
    tick();

    expect(
      feedbackBackendApiService.submitMyFeedbackFollowUpAsync
    ).toHaveBeenCalled();
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Your follow up note has not been sent successfully'
    );
    expect(ngbActiveModal.dismiss).not.toHaveBeenCalled();
    expect(component.followUpText).toEqual('test');
    expect(component.isSubmittingFollowUp).toEqual(false);
  }));

  it('should dismiss modal', () => {
    component.followUpText = 'test';
    component.closemodal();
    expect(ngbActiveModal.dismiss).toHaveBeenCalled();
    expect(component.followUpText).toEqual('');
    expect(component.isSubmittingFollowUp).toEqual(false);
  });
});

describe('AddAFollowUpNoteModalComponent opened as a bottom sheet', () => {
  let component: AddAFollowUpNoteModalComponent;
  let fixture: ComponentFixture<AddAFollowUpNoteModalComponent>;
  let alertsService: AlertsService;
  let feedbackBackendApiService: FeedbackBackendApiService;
  let ngbActiveModal: NgbActiveModal;
  let bottomSheetDismissSpy: jasmine.Spy;
  let detailFeedback: LessonFeedbackDetailResponse;

  beforeEach(waitForAsync(() => {
    detailFeedback = {
      id: 'test_report_id',
      feedback_text: 'Test report',
      status: FeedbackStatus.OPEN,
      lesson_metadata: {
        exploration_id: 'test',
        exploration_version: 1,
        state_name: 'intro',
        state_index: 1,
        learner_current_answer: 'test',
      },
      parent_feedback_id: null,
      response_list: [],
      unread_response_count: 0,
      created_on_msecs: 123456,
    };
    const mockBottomSheetRef = {dismiss: () => {}};
    bottomSheetDismissSpy = spyOn(mockBottomSheetRef, 'dismiss');
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule],
      declarations: [AddAFollowUpNoteModalComponent, MockTranslatePipe],
      providers: [
        AlertsService,
        FeedbackBackendApiService,
        NgbActiveModal,
        {provide: MatBottomSheetRef, useValue: mockBottomSheetRef},
        {provide: MAT_BOTTOM_SHEET_DATA, useValue: {detailFeedback}},
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddAFollowUpNoteModalComponent);
    component = fixture.componentInstance;
    alertsService = TestBed.inject(AlertsService);
    feedbackBackendApiService = TestBed.inject(FeedbackBackendApiService);
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    spyOn(alertsService, 'addSuccessMessage');
    spyOn(ngbActiveModal, 'dismiss');
    // No input binding is set here, so the detail feedback must come from
    // the injected bottom sheet data.
    fixture.detectChanges();
  });

  it('should read the detail feedback from the bottom sheet data', () => {
    expect(component.detailFeedback).toEqual(detailFeedback);
  });

  it('should dismiss the bottom sheet after a successful submission', fakeAsync(() => {
    spyOn(
      feedbackBackendApiService,
      'submitMyFeedbackFollowUpAsync'
    ).and.returnValue(
      Promise.resolve({
        success: true,
      })
    );
    component.followUpText = 'test';
    component.submit();
    tick();

    expect(
      feedbackBackendApiService.submitMyFeedbackFollowUpAsync
    ).toHaveBeenCalled();
    expect(bottomSheetDismissSpy).toHaveBeenCalled();
    expect(ngbActiveModal.dismiss).not.toHaveBeenCalled();
  }));
});
