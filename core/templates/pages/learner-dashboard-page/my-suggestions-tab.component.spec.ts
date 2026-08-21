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
import {MySuggestionsTabComponent} from './my-suggestions-tab.component';
import {AlertsService} from 'services/alerts.service';
import {DateTimeFormatService} from 'services/date-time-format.service';
import {UrlService} from 'services/contextual/url.service';
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
  SuccessResponse,
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

const mockSuccessResponse: SuccessResponse = {
  success: true,
};

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve(),
    };
  }
}

describe('My Suggestions Tab Component', () => {
  let component: MySuggestionsTabComponent;
  let fixture: ComponentFixture<MySuggestionsTabComponent>;
  let alertsService: AlertsService;
  let dateTimeFormatService: DateTimeFormatService;
  let urlService: UrlService;
  let windowRef: WindowRef;
  let loaderService: LoaderService;
  let feedbackBackendApiService: FeedbackBackendApiService;
  let ngbModal: NgbModal;

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
    alertsService = TestBed.inject(AlertsService);
    dateTimeFormatService = TestBed.inject(DateTimeFormatService);
    urlService = TestBed.inject(UrlService);
    windowRef = TestBed.inject(WindowRef);
    loaderService = TestBed.inject(LoaderService);
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
});
