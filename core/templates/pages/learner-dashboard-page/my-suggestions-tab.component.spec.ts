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
// @ts-nocheck
/**
 * @fileoverview Unit tests for My Suggestions tab in learner dashboard.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
  waitForAsync,
} from '@angular/core/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import {MatBottomSheetModule} from '@angular/material/bottom-sheet';
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
import {BaseModule} from '../../base-components/base.module';
import {FeedbackSharedModule} from 'components/feedback-shared/feedback-shared.module';
import {
  CreatorFeedbackType,
  FeedbackStatus,
  LessonFeedbackDetailResponse,
  LessonFeedbackSummary,
  ReportType,
  TechnicalTeamType,
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
      declarations: [MySuggestionsTabComponent, MockTranslatePipe],
      imports: [
        BaseModule,
        FeedbackSharedModule,
        MatBottomSheetModule,
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

  it('should sync the shared unread count when reading feedback on a later page', fakeAsync(() => {
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

    component.openFeedbackDetail('feedback_id');
    flushMicrotasks();

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
  }));

  it('should not change the shared unread count when refreshing it fails', fakeAsync(() => {
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

    component.openFeedbackDetail('feedback_id');
    flushMicrotasks();

    expect(emitSpy).not.toHaveBeenCalled();
  }));

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

  it('should load and map the first feedback page on initialization', fakeAsync(() => {
    const urlService = TestBed.inject(UrlService);
    spyOn(urlService, 'getUrlParams').and.returnValue({});
    const loaderService = TestBed.inject(LoaderService);
    const hideLoadingSpy = spyOn(loaderService, 'hideLoadingScreen');
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(
      feedbackBackendApiService,
      'fetchLearnerLessonFeedbackListAsync'
    ).and.returnValue(
      Promise.resolve({
        summaries: [
          {
            ...mockLessonFeedbackSummary,
            id: 'fb_open',
            status: FeedbackStatus.OPEN,
          },
          {
            ...mockLessonFeedbackSummary,
            id: 'fb_fixed',
            status: FeedbackStatus.FIXED,
          },
          {
            ...mockLessonFeedbackSummary,
            id: 'fb_reviewed',
            status: FeedbackStatus.COMPLIMENT,
          },
        ],
        next_cursor: 'cursor_2',
        more: true,
      })
    );

    component.ngOnInit();
    flushMicrotasks();

    expect(component.isLoading).toBeFalse();
    const state = component.learnerLessonFeedbackListState;
    // Backend statuses are mapped to learner-facing statuses.
    expect(state.summaries.map(summary => summary.status)).toEqual([
      FeedbackStatus.SUBMITTED,
      FeedbackStatus.LESSON_UPDATED,
      FeedbackStatus.REVIEWED_BY_TEAM,
    ]);
    expect(state.nextCursor).toBe('cursor_2');
    expect(state.moreAvailable).toBeTrue();
    // With no search text, every summary is displayed.
    expect(state.displayedSummaries).toEqual(state.summaries);
    expect(hideLoadingSpy).toHaveBeenCalled();
  }));

  it(
    'should open the detail view directly when a feedback id is present in' +
      ' the url on initialization',
    fakeAsync(() => {
      const urlService = TestBed.inject(UrlService);
      spyOn(urlService, 'getUrlParams').and.returnValue({
        feedback_id: 'feedback_url',
      });
      const loaderService = TestBed.inject(LoaderService);
      spyOn(loaderService, 'hideLoadingScreen');
      spyOn(
        feedbackBackendApiService,
        'fetchMyFeedbackDetailAsync'
      ).and.returnValue(Promise.resolve(mockLessonFeedbackDetailResponse));
      spyOn(
        feedbackBackendApiService,
        'fetchMyFeedbackUnreadCountAsync'
      ).and.returnValue(Promise.resolve(0));
      const listSpy = spyOn(
        feedbackBackendApiService,
        'fetchLearnerLessonFeedbackListAsync'
      );

      component.ngOnInit();
      flushMicrotasks();

      expect(listSpy).not.toHaveBeenCalled();
      expect(component.selectedFeedbackId).toBe('feedback_url');
      expect(component.selectedFeedback).toEqual(
        mockLessonFeedbackDetailResponse
      );
      expect(component.isLoading).toBeFalse();
    })
  );

  it('should select a row and load its detail when clicked', fakeAsync(() => {
    spyOn(
      feedbackBackendApiService,
      'fetchMyFeedbackDetailAsync'
    ).and.returnValue(Promise.resolve(mockLessonFeedbackDetailResponse));
    spyOn(
      feedbackBackendApiService,
      'fetchMyFeedbackUnreadCountAsync'
    ).and.returnValue(Promise.resolve(0));

    component.onLearnerFeedbackRowClick('row_feedback_1');
    flushMicrotasks();

    expect(component.selectedFeedbackId).toBe('row_feedback_1');
    expect(component.selectedFeedback).toEqual(
      mockLessonFeedbackDetailResponse
    );
  }));

  it('should return display details for each feedback status', () => {
    expect(component.getStatusDetails(FeedbackStatus.FIXED)).toEqual({
      label: 'Lesson Updated!',
      className: 'oppia-my-suggestions-status-fixed',
      tooltip:
        'A creator fixed this error! Thank you for helping make Oppia' +
        ' better for everyone.',
    });
    expect(component.getStatusDetails(FeedbackStatus.NOT_ACTIONABLE)).toEqual({
      label: 'Reviewed by Team',
      className: 'oppia-my-suggestions-status-reviewed',
      tooltip: null,
    });
    expect(component.getStatusDetails(FeedbackStatus.COMPLIMENT)).toEqual({
      label: 'Reviewed by Team',
      className: 'oppia-my-suggestions-status-reviewed',
      tooltip: null,
    });
    expect(component.getStatusDetails(FeedbackStatus.SUBMITTED)).toEqual({
      label: 'Submitted',
      className: 'oppia-my-suggestions-status-submitted',
      tooltip: null,
    });
  });

  it('should format timestamps and lesson step descriptions', () => {
    const dateTimeFormatService = TestBed.inject(DateTimeFormatService);
    spyOn(
      dateTimeFormatService,
      'getLocaleAbbreviatedDatetimeString'
    ).and.returnValue('Jan 1, 2021');

    expect(component.formatDate(1609459200000)).toBe('Jan 1, 2021');
    expect(component.getLessonStepDescription('End')).toBe(
      'around the "End" part of the lesson'
    );
  });

  it('should apply search locally when the server filters are unchanged', () => {
    const state = component.learnerLessonFeedbackListState;
    state.summaries = [
      {
        ...mockLessonFeedbackSummary,
        id: 'summary_a',
        feedback_text_preview: 'The audio is broken',
      },
      {
        ...mockLessonFeedbackSummary,
        id: 'summary_b',
        feedback_text_preview: 'Great lesson',
      },
    ];
    state.nextCursor = 'cursor_2';
    component.currentLearnerFeedbackFilterState = {
      searchText: '',
      status: FeedbackStatus.ALL,
      technicalTeam: TechnicalTeamType.TECH_EXTERNAL,
      creatorFeedbackType: CreatorFeedbackType.FEEDBACK,
      dateRange: {start: null, end: null},
    };
    const listSpy = spyOn(
      feedbackBackendApiService,
      'fetchLearnerLessonFeedbackListAsync'
    );

    component.onLearnerFeedbackFilterChange({
      searchText: 'GREAT',
      status: FeedbackStatus.ALL,
      technicalTeam: TechnicalTeamType.TECH_EXTERNAL,
      creatorFeedbackType: CreatorFeedbackType.FEEDBACK,
      dateRange: {start: null, end: null},
    });

    expect(listSpy).not.toHaveBeenCalled();
    expect(state.displayedSummaries.map(summary => summary.id)).toEqual([
      'summary_b',
    ]);
  });

  it('should refetch from the first page when the server filters change', fakeAsync(() => {
    const state = component.learnerLessonFeedbackListState;
    state.summaries = [mockLessonFeedbackSummary];
    state.currentPage = 3;
    state.cursorHistory = [null, 'cursor_2', 'cursor_3'];
    const listSpy = spyOn(
      feedbackBackendApiService,
      'fetchLearnerLessonFeedbackListAsync'
    ).and.returnValue(
      Promise.resolve({summaries: [], next_cursor: null, more: false})
    );

    component.onLearnerFeedbackFilterChange({
      searchText: '',
      status: FeedbackStatus.FIXED,
      technicalTeam: TechnicalTeamType.TECH_EXTERNAL,
      creatorFeedbackType: CreatorFeedbackType.FEEDBACK,
      dateRange: {start: null, end: null},
    });
    flushMicrotasks();

    expect(state.currentPage).toBe(1);
    expect(state.nextCursor).toBeNull();
    expect(state.cursorHistory).toEqual([null]);
    expect(listSpy).toHaveBeenCalledWith(
      component.currentLearnerFeedbackFilterState,
      null
    );
  }));

  it(
    'should refetch from the first page when the filters are unchanged but no' +
      ' data is loaded yet',
    fakeAsync(() => {
      const listSpy = spyOn(
        feedbackBackendApiService,
        'fetchLearnerLessonFeedbackListAsync'
      ).and.returnValue(
        Promise.resolve({summaries: [], next_cursor: null, more: false})
      );

      component.onLearnerFeedbackFilterChange({
        searchText: 'anything',
        status: FeedbackStatus.ALL,
        technicalTeam: TechnicalTeamType.TECH_EXTERNAL,
        creatorFeedbackType: CreatorFeedbackType.FEEDBACK,
        dateRange: {start: null, end: null},
      });
      flushMicrotasks();

      expect(listSpy).toHaveBeenCalledWith(
        component.currentLearnerFeedbackFilterState,
        null
      );
    })
  );

  it('should not request another page when none is available', () => {
    const listSpy = spyOn(
      feedbackBackendApiService,
      'fetchLearnerLessonFeedbackListAsync'
    );

    component.learnerLessonFeedbackListState.moreAvailable = false;
    component.onLearnerFeedbackNextPage();
    expect(listSpy).not.toHaveBeenCalled();

    component.learnerLessonFeedbackListState.moreAvailable = true;
    component.learnerLessonFeedbackListState.nextCursor = null;
    component.onLearnerFeedbackNextPage();
    expect(listSpy).not.toHaveBeenCalled();
  });

  it('should advance to the next page and track the cursor history', fakeAsync(() => {
    const state = component.learnerLessonFeedbackListState;
    state.moreAvailable = true;
    state.nextCursor = 'cursor_2';
    state.currentPage = 1;
    state.cursorHistory = [null];
    const listSpy = spyOn(
      feedbackBackendApiService,
      'fetchLearnerLessonFeedbackListAsync'
    ).and.returnValue(
      Promise.resolve({summaries: [], next_cursor: null, more: false})
    );

    component.onLearnerFeedbackNextPage();
    flushMicrotasks();

    expect(listSpy).toHaveBeenCalledWith(
      component.currentLearnerFeedbackFilterState,
      'cursor_2'
    );
    expect(state.cursorHistory).toEqual([null, 'cursor_2']);
    expect(state.currentPage).toBe(2);
  }));

  it(
    'should reuse an existing cursor history entry when moving forward after' +
      ' going back',
    fakeAsync(() => {
      const state = component.learnerLessonFeedbackListState;
      state.moreAvailable = true;
      state.nextCursor = 'cursor_3';
      state.currentPage = 2;
      state.cursorHistory = [null, 'cursor_2', 'cursor_3'];
      const listSpy = spyOn(
        feedbackBackendApiService,
        'fetchLearnerLessonFeedbackListAsync'
      ).and.returnValue(
        Promise.resolve({summaries: [], next_cursor: 'cursor_3', more: true})
      );

      component.onLearnerFeedbackNextPage();
      flushMicrotasks();

      // The history entry for page 3 already exists, so it is not duplicated.
      expect(state.cursorHistory).toEqual([null, 'cursor_2', 'cursor_3']);
      expect(state.currentPage).toBe(3);
      expect(listSpy).toHaveBeenCalledWith(
        component.currentLearnerFeedbackFilterState,
        'cursor_3'
      );
    })
  );

  it('should not go back past the first page', () => {
    const listSpy = spyOn(
      feedbackBackendApiService,
      'fetchLearnerLessonFeedbackListAsync'
    );

    component.learnerLessonFeedbackListState.currentPage = 1;
    component.onLearnerFeedbackPreviousPage();

    expect(listSpy).not.toHaveBeenCalled();
  });

  it('should return to the previous page using the stored cursor', fakeAsync(() => {
    const state = component.learnerLessonFeedbackListState;
    state.currentPage = 2;
    state.cursorHistory = [null, 'cursor_2'];
    const listSpy = spyOn(
      feedbackBackendApiService,
      'fetchLearnerLessonFeedbackListAsync'
    ).and.returnValue(
      Promise.resolve({summaries: [], next_cursor: 'cursor_2', more: true})
    );

    component.onLearnerFeedbackPreviousPage();
    flushMicrotasks();

    expect(listSpy).toHaveBeenCalledWith(
      component.currentLearnerFeedbackFilterState,
      null
    );
    expect(state.currentPage).toBe(1);
  }));

  it('should warn when loading a feedback detail fails', fakeAsync(() => {
    const alertsService = TestBed.inject(AlertsService);
    const addWarningSpy = spyOn(alertsService, 'addWarning');
    const loaderService = TestBed.inject(LoaderService);
    const hideLoadingSpy = spyOn(loaderService, 'hideLoadingScreen');
    spyOn(
      feedbackBackendApiService,
      'fetchMyFeedbackDetailAsync'
    ).and.returnValue(Promise.reject());

    component.openFeedbackDetail('feedback_bad');
    flushMicrotasks();

    expect(addWarningSpy).toHaveBeenCalledWith(
      'Failed to load this suggestion.'
    );
    expect(hideLoadingSpy).toHaveBeenCalled();
  }));

  it('should ignore a stale detail response after selecting other feedback', fakeAsync(() => {
    let resolveDetail!: (response: LessonFeedbackDetailResponse) => void;
    spyOn(
      feedbackBackendApiService,
      'fetchMyFeedbackDetailAsync'
    ).and.returnValue(
      new Promise<LessonFeedbackDetailResponse>(resolve => {
        resolveDetail = resolve;
      })
    );
    const unreadCountSpy = spyOn(
      feedbackBackendApiService,
      'fetchMyFeedbackUnreadCountAsync'
    ).and.returnValue(Promise.resolve(0));

    component.openFeedbackDetail('feedback_a');
    component.selectedFeedbackId = 'feedback_b';
    resolveDetail(mockLessonFeedbackDetailResponse);
    flushMicrotasks();

    expect(component.selectedFeedback).toBeNull();
    expect(unreadCountSpy).not.toHaveBeenCalled();
  }));

  it('should allow follow-up notes only for fixed feedback', () => {
    component.selectedFeedback = {
      ...mockLessonFeedbackDetailResponse,
      status: FeedbackStatus.FIXED,
    };
    expect(component.canAddFollowUpNote()).toBeTrue();

    component.selectedFeedback = mockLessonFeedbackDetailResponse;
    expect(component.canAddFollowUpNote()).toBeFalse();

    component.selectedFeedback = null;
    expect(component.canAddFollowUpNote()).toBeFalse();
  });

  it(
    'should clear the selection and refresh the list when navigating back to' +
      ' the list view',
    fakeAsync(() => {
      component.selectedFeedbackId = 'feedback_id';
      component.selectedFeedback = mockLessonFeedbackDetailResponse;
      const replaceStateSpy = spyOn(window.history, 'replaceState');
      const loaderShowSpy = spyOn(
        TestBed.inject(LoaderService),
        'showLoadingScreen'
      );
      const listSpy = spyOn(
        feedbackBackendApiService,
        'fetchLearnerLessonFeedbackListAsync'
      ).and.returnValue(
        Promise.resolve({summaries: [], next_cursor: null, more: false})
      );

      component.goBackToListView();
      flushMicrotasks();

      expect(component.selectedFeedbackId).toBeNull();
      expect(component.selectedFeedback).toBeNull();
      expect(replaceStateSpy).toHaveBeenCalledWith(
        {},
        '',
        '/learner-dashboard'
      );
      expect(listSpy).toHaveBeenCalled();
      expect(loaderShowSpy).toHaveBeenCalledWith('Loading');
    })
  );
});
