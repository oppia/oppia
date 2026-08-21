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
 * @fileoverview Unit tests for My Suggestions tab in learner dashboard.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import {MySuggestionsTabComponent} from './my-suggestions-tab.component';
import {AddAFollowUpNoteModalComponent} from './add-a-follow-up-note-modal/add-a-follow-up-note-modal.component';
import {AlertsService} from 'services/alerts.service';
import {DateTimeFormatService} from 'services/date-time-format.service';
import {UrlService} from 'services/contextual/url.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {LoaderService} from 'services/loader.service';
import {FeedbackBackendApiService} from 'domain/feedback/feedback-backend-api.service';
import {RouterTestingModule} from '@angular/router/testing';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {LearnerDashboardPageModule} from '../learner-dashboard-page/learner-dashboard-page.module';
import {LessonFeedbackSummary} from 'domain/feedback/feedback.model';
import {
  FeedbackStatus,
  LessonFeedbackDetailResponse,
  ReportType,
} from '../../domain/feedback/feedback.model';

const mockLessonFeedbackSummary: LessonFeedbackSummary = {
  id: 'lesson_feedback_1',
  feedback_text_preview: 'Lesson feedback',
  latest_response_preview: '',
  status: FeedbackStatus.OPEN,
  source: ReportType.LESSON,
  lesson_title: 'exp_1',
  unread_response_count: 0,
  last_updated_msecs: 12345,
};

const mockLessonFeedbackDetailResponse: LessonFeedbackDetailResponse = {
  id: 'feedback_id',
  feedback_text: 'feedback',
  status: FeedbackStatus.OPEN,
  lesson_metadata: {
    exploration_id: 'exp_id',
    exploration_version: 1,
    state_name: 'Introduction',
    state_index: 0,
    learner_current_answer: null,
  },
  parent_feedback_id: null,
  response_list: [],
  unread_response_count: 0,
  created_on_msecs: 12345,
};

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve(),
      componentInstance: {},
    };
  }
}

describe('My Suggestions Tab Component', () => {
  let component: MySuggestionsTabComponent;
  let fixture: ComponentFixture<MySuggestionsTabComponent>;
  let feedbackBackendApiService: FeedbackBackendApiService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        LearnerDashboardPageModule,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      providers: [
        AlertsService,
        DateTimeFormatService,
        UrlService,
        WindowRef,
        LoaderService,
        FeedbackBackendApiService,
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MySuggestionsTabComponent);
    component = fixture.componentInstance;
    feedbackBackendApiService = TestBed.inject(FeedbackBackendApiService);
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should get displayed learner feedback summaries', () => {
    component.learnerLessonFeedbackListState.displayedSummaries = [
      mockLessonFeedbackSummary,
    ];
    expect(component.getDisplayedLearnerFeedbackSummaries()).toEqual([
      mockLessonFeedbackSummary,
    ]);
  });

  it('should get current page number of learner feedback list view', () => {
    component.learnerLessonFeedbackListState.currentPage = 1;
    expect(component.getLearnerFeedbackListCurrentPage()).toEqual(1);
  });

  it('should return true if learner feedback list has more than one page', () => {
    component.learnerLessonFeedbackListState.moreAvailable = true;
    expect(component.getLearnerFeedbackListMoreAvailable()).toEqual(true);
  });

  it('should sync the shared unread count when reading feedback on a later page', async () => {
    // The unread entry lives on a later page of the paginated list, so the
    // refreshed global total must come from the backend rather than from the
    // summaries currently loaded.
    const laterPageSummary: LessonFeedbackSummary = {
      ...mockLessonFeedbackSummary,
      id: 'feedback_id',
      unread_response_count: 2,
    };
    component.learnerLessonFeedbackListState.summaries = [laterPageSummary];
    component.learnerLessonFeedbackListState.displayedSummaries = [
      laterPageSummary,
    ];

    spyOn(
      feedbackBackendApiService,
      'fetchMyFeedbackDetailAsync'
    ).and.returnValue(Promise.resolve(mockLessonFeedbackDetailResponse));
    spyOn(
      feedbackBackendApiService,
      'fetchMyFeedbackUnreadCountAsync'
    ).and.returnValue(Promise.resolve(2));
    const emitSpy = spyOn(component.unreadCountChanged, 'emit');

    await component.openFeedbackDetail('feedback_id');

    expect(
      feedbackBackendApiService.fetchMyFeedbackUnreadCountAsync
    ).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith(2);
    expect(
      component.learnerLessonFeedbackListState.summaries[0]
        .unread_response_count
    ).toBe(0);
    expect(
      component.learnerLessonFeedbackListState.displayedSummaries[0]
        .unread_response_count
    ).toBe(0);
  });

  it('should not change the shared unread count when refreshing it fails', async () => {
    const laterPageSummary: LessonFeedbackSummary = {
      ...mockLessonFeedbackSummary,
      id: 'feedback_id',
      unread_response_count: 2,
    };
    component.learnerLessonFeedbackListState.summaries = [laterPageSummary];
    component.learnerLessonFeedbackListState.displayedSummaries = [
      laterPageSummary,
    ];

    spyOn(
      feedbackBackendApiService,
      'fetchMyFeedbackDetailAsync'
    ).and.returnValue(Promise.resolve(mockLessonFeedbackDetailResponse));
    spyOn(
      feedbackBackendApiService,
      'fetchMyFeedbackUnreadCountAsync'
    ).and.returnValue(Promise.reject());
    const emitSpy = spyOn(component.unreadCountChanged, 'emit');

    await component.openFeedbackDetail('feedback_id');

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should open the follow-up note modal on wide screens', () => {
    const windowDimensionsService = TestBed.inject(WindowDimensionsService);
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    const bottomSheet = TestBed.inject(MatBottomSheet);
    const bottomSheetSpy = spyOn(bottomSheet, 'open');
    const ngbModal = TestBed.inject(NgbModal);
    const ngbModalSpy = spyOn(ngbModal, 'open').and.callThrough();

    component.openFollowUpModal();

    expect(bottomSheetSpy).not.toHaveBeenCalled();
    expect(ngbModalSpy).toHaveBeenCalled();
  });

  it('should open the follow-up note bottom sheet on narrow screens', () => {
    const windowDimensionsService = TestBed.inject(WindowDimensionsService);
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(true);
    const bottomSheet = TestBed.inject(MatBottomSheet);
    const bottomSheetSpy = spyOn(bottomSheet, 'open');
    const ngbModal = TestBed.inject(NgbModal);
    const ngbModalSpy = spyOn(ngbModal, 'open');

    component.openFollowUpModal();

    expect(bottomSheetSpy).toHaveBeenCalledWith(
      AddAFollowUpNoteModalComponent,
      {
        data: {detailFeedback: null},
      }
    );
    expect(ngbModalSpy).not.toHaveBeenCalled();
  });
});
