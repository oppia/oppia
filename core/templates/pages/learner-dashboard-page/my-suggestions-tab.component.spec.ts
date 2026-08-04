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
 * @fileoverview Unit tests for MySuggestionsTabComponent.
 */

import {
  ComponentFixture,
  fakeAsync,
  flushMicrotasks,
  TestBed,
  tick,
} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import {FeedbackBackendApiService} from 'domain/feedback/feedback-backend-api.service';
import {
  FeedbackStatus,
  LessonFeedbackBackendResponse,
  LessonFeedbackDetailResponse,
} from 'domain/feedback/feedback.model';
import {DateTimeFormatService} from 'services/date-time-format.service';
import {UrlService} from 'services/contextual/url.service';
import {MySuggestionsTabComponent} from './my-suggestions-tab.component';

describe('MySuggestionsTabComponent', () => {
  let component: MySuggestionsTabComponent;
  let fixture: ComponentFixture<MySuggestionsTabComponent>;
  let feedbackBackendApiService: jasmine.SpyObj<FeedbackBackendApiService>;
  let dateTimeFormatService: jasmine.SpyObj<DateTimeFormatService>;
  let urlService: jasmine.SpyObj<UrlService>;
  let ngbModal: jasmine.SpyObj<NgbModal>;

  const feedbackListResponse: LessonFeedbackBackendResponse = {
    summaries: [
      {
        id: 'feedback_1',
        feedback_text_preview: 'This fraction model is awesome.',
        status: FeedbackStatus.OPEN,
        source: 'lesson',
        unread_response_count: 0,
      },
      {
        id: 'feedback_2',
        feedback_text_preview: 'The image looks broken.',
        status: FeedbackStatus.FIXED,
        source: 'lesson',
        unread_response_count: 1,
      },
    ],
    next_cursor: null,
    more: false,
  };

  const feedbackDetailResponse: LessonFeedbackDetailResponse = {
    id: 'feedback_2',
    feedback_text: 'The image looks broken.',
    status: FeedbackStatus.FIXED,
    lesson_metadata: {
      exploration_id: 'exp_1',
      exploration_version: 3,
      state_name: 'Fractions',
      state_index: 2,
      learner_current_answer: null,
    },
    parent_feedback_id: null,
    response_list: [
      {
        response_text: 'Thanks, this is fixed now.',
        responded_on: 12345,
      },
    ],
    unread_response_count: 1,
    created_on_msecs: 1000,
  };

  beforeEach(() => {
    feedbackBackendApiService = jasmine.createSpyObj(
      'FeedbackBackendApiService',
      [
        'fetchMyFeedbackListAsync',
        'fetchMyFeedbackDetailAsync',
        'submitMyFeedbackFollowUpAsync',
      ]
    );
    dateTimeFormatService = jasmine.createSpyObj('DateTimeFormatService', [
      'getLocaleAbbreviatedDatetimeString',
    ]);
    urlService = jasmine.createSpyObj('UrlService', ['getUrlParams']);
    ngbModal = jasmine.createSpyObj('NgbModal', ['open']);

    feedbackBackendApiService.fetchMyFeedbackListAsync.and.resolveTo(
      feedbackListResponse
    );
    feedbackBackendApiService.fetchMyFeedbackDetailAsync.and.resolveTo(
      feedbackDetailResponse
    );
    feedbackBackendApiService.submitMyFeedbackFollowUpAsync.and.resolveTo({
      success: true,
    });
    dateTimeFormatService.getLocaleAbbreviatedDatetimeString.and.returnValue(
      'Jan 1, 2026'
    );
    urlService.getUrlParams.and.returnValue({});

    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [MySuggestionsTabComponent],
      providers: [
        {
          provide: FeedbackBackendApiService,
          useValue: feedbackBackendApiService,
        },
        {
          provide: DateTimeFormatService,
          useValue: dateTimeFormatService,
        },
        {
          provide: UrlService,
          useValue: urlService,
        },
        {
          provide: NgbModal,
          useValue: ngbModal,
        },
      ],
    });

    fixture = TestBed.createComponent(MySuggestionsTabComponent);
    component = fixture.componentInstance;
  });

  it('should load feedback summaries and emit unread count', fakeAsync(() => {
    const unreadCountSpy = jasmine.createSpy('unreadCountSpy');
    component.unreadCountChanged.subscribe(unreadCountSpy);

    fixture.detectChanges();
    flushMicrotasks();

    expect(component.feedbackSummaries.length).toBe(2);
    expect(unreadCountSpy).toHaveBeenCalledWith(1);
  }));

  it('should open targeted feedback from URL and mark it read', fakeAsync(() => {
    const unreadCountSpy = jasmine.createSpy('unreadCountSpy');
    urlService.getUrlParams.and.returnValue({
      active_tab: 'my-suggestions',
      feedback_id: 'feedback_2',
    });
    spyOn(document, 'querySelector').and.returnValue(null);
    component.unreadCountChanged.subscribe(unreadCountSpy);

    fixture.detectChanges();
    flushMicrotasks();
    tick();

    expect(
      feedbackBackendApiService.fetchMyFeedbackDetailAsync
    ).toHaveBeenCalledWith('feedback_2');
    expect(component.selectedFeedbackId).toBe('feedback_2');
    expect(component.selectedFeedback).toEqual(feedbackDetailResponse);
    expect(unreadCountSpy).toHaveBeenCalledWith(0);
  }));

  it('should show learner-facing status details', () => {
    expect(component.getStatusDetails(FeedbackStatus.OPEN).label).toBe(
      'Submitted'
    );
    expect(
      component.getStatusDetails(FeedbackStatus.NOT_ACTIONABLE).label
    ).toBe('Reviewed by Team');
    expect(component.getStatusDetails(FeedbackStatus.FIXED)).toEqual({
      label: 'Lesson Updated!',
      className: 'oppia-my-suggestions-status-fixed',
      tooltip:
        'A creator fixed this error! Thank you for helping make Oppia better for everyone.',
    });
  });

  it('should submit follow-up note and reload selected feedback', fakeAsync(() => {
    component.followUpModalRef = jasmine.createSpyObj('NgbModalRef', [
      'close',
    ]) as unknown as typeof component.followUpModalRef;
    component.selectedFeedbackId = 'feedback_2';
    component.followUpText = 'Can you also add more marble examples?';

    component.submitFollowUp();
    flushMicrotasks();

    expect(
      feedbackBackendApiService.submitMyFeedbackFollowUpAsync
    ).toHaveBeenCalledWith(
      'feedback_2',
      'Can you also add more marble examples?'
    );
    expect(component.followUpText).toBe('');
    expect(
      feedbackBackendApiService.fetchMyFeedbackListAsync
    ).toHaveBeenCalled();
  }));

  it('should only allow follow-up notes for fixed feedback', () => {
    component.selectedFeedback = {
      ...feedbackDetailResponse,
      status: FeedbackStatus.OPEN,
    };

    expect(component.canAddFollowUpNote()).toBe(false);

    component.selectedFeedback = {
      ...feedbackDetailResponse,
      status: FeedbackStatus.FIXED,
    };

    expect(component.canAddFollowUpNote()).toBe(true);
  });

  it('should format notification summaries for unread creator updates', () => {
    expect(
      component.getNotificationSummary(feedbackListResponse.summaries[1])
    ).toBe(
      'A creator fixed an error you reported. Thank you for helping make ' +
        'Oppia better for everyone!'
    );
  });
});
