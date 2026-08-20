// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for feedbackTab.
 */

import {
  ComponentFixture,
  fakeAsync,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';
import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {AlertsService} from 'services/alerts.service';
import {SuggestionThread} from 'domain/suggestion/suggestion-thread-object.model';
import {DateTimeFormatService} from 'services/date-time-format.service';
import {UserService} from 'services/user.service';
import {ChangeListService} from '../services/change-list.service';
import {EditabilityService} from 'services/editability.service';
import {ExplorationStatesService} from '../services/exploration-states.service';
import {ThreadDataBackendApiService} from './services/thread-data-backend-api.service';
import {FeedbackTabComponent} from './feedback-tab.component';
import {UserInfo} from 'domain/user/user-info.model';
import {FeedbackThread} from 'domain/feedback_thread/feedback-thread.model';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {PageContextService} from 'services/page-context.service';
import {FeedbackBackendApiService} from 'domain/feedback/feedback-backend-api.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {UserExplorationPermissionsService} from '../services/user-exploration-permissions.service';
import {
  CREATOR_DASHBOARD_FILTER_CONFIG,
  CreatorFeedbackType,
  FeedbackFilterState,
  FeedbackModalType,
  FeedbackStatus,
  LessonFeedbackBackendResponse,
  LessonFeedbackDetailResponse,
  LessonFeedbackSummary,
  PlatformFeedbackDetailResponse,
  PlatformFeedbackSummary,
  ReportAnIssueCategory,
  ReportType,
  SuccessResponse,
} from '../../../domain/feedback/feedback.model';

class MockPlatformFeatureService {
  status = {
    ExplorationEditorNewCreatorFeedbackTab: {
      isEnabled: false,
    },
  };
}

const mockLessonFeedbackSummary: LessonFeedbackSummary = {
  id: 'lesson_feedback_1',
  feedback_text_preview: 'Lesson feedback',
  status: FeedbackStatus.OPEN,
  source: ReportType.LESSON,
  unread_response_count: 0,
};

const mockPlatformFeedbackSummary: PlatformFeedbackSummary = {
  id: 'platform_feedback_1',
  report_message_preview: 'Platform report',
  status: FeedbackStatus.OPEN,
  category: ReportAnIssueCategory.OTHER_OR_NOT_SURE,
  source: ReportAnIssueCategory.OTHER_OR_NOT_SURE,
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

const mockPlatformFeedbackDetailResponse: PlatformFeedbackDetailResponse = {
  id: 'report_id',
  report_message: 'Report message',
  source: ReportType.APP,
  status: FeedbackStatus.OPEN,
  platform: 'web',
  destination_dashboard: 'curriculum',
  page_url: '/learn',
  category: ReportAnIssueCategory.OTHER_OR_NOT_SURE,
  lesson_metadata: null,
  include_technical_logs: false,
  session_info: null,
  screenshot_filename: 'image.png',
  screenshot_entity_id: 'entity_id',
  created_on_msecs: 1000,
};

const mockSuccessResponse: SuccessResponse = {
  success: true,
};

describe('Feedback Tab Component', () => {
  let component: FeedbackTabComponent;
  let fixture: ComponentFixture<FeedbackTabComponent>;
  let alertsService: AlertsService;
  let changeListService: ChangeListService;
  let dateTimeFormatService: DateTimeFormatService;
  let editabilityService: EditabilityService;
  let explorationStatesService: ExplorationStatesService;
  let threadDataBackendApiService: ThreadDataBackendApiService;
  let userService: UserService;
  let ngbModal: NgbModal;
  let mockPlatformFeatureService = new MockPlatformFeatureService();
  let windowRef: WindowRef;
  let assetsBackendApiService: AssetsBackendApiService;
  let pageContextService: PageContextService;
  let feedbackBackendApiService: FeedbackBackendApiService;
  let userExplorationPermissionsService: UserExplorationPermissionsService;

  const createWindowWithHash = (): Window & {triggerHashChange: () => void} => {
    let hash = '';
    let hashChangeListener: (() => void) | null = null;
    const mockWindow = {
      location: {
        get hash(): string {
          return hash;
        },
        set hash(value: string) {
          hash = value.startsWith('#') ? value : `#${value}`;
        },
        pathname: '',
        search: '',
      },
      addEventListener: (event: string, listener: () => void) => {
        if (event === 'hashchange') {
          hashChangeListener = listener;
        }
      },
      removeEventListener: (event: string) => {
        if (event === 'hashchange') {
          hashChangeListener = null;
        }
      },
      triggerHashChange: () => {
        if (hashChangeListener) {
          hashChangeListener();
        }
      },
    };
    return mockWindow as unknown as Window & {triggerHashChange: () => void};
  };

  class MockNgbModal {
    open() {
      return {
        result: Promise.resolve(),
      };
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule],
      declarations: [FeedbackTabComponent],
      providers: [
        ChangeListService,
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    mockPlatformFeatureService.status.ExplorationEditorNewCreatorFeedbackTab.isEnabled =
      false;
    window.history.replaceState(null, '', window.location.pathname);

    fixture = TestBed.createComponent(FeedbackTabComponent);
    component = fixture.componentInstance;

    alertsService = TestBed.inject(AlertsService);
    changeListService = TestBed.inject(ChangeListService);
    dateTimeFormatService = TestBed.inject(DateTimeFormatService);
    ngbModal = TestBed.inject(NgbModal);
    editabilityService = TestBed.inject(EditabilityService);
    explorationStatesService = TestBed.inject(ExplorationStatesService);
    threadDataBackendApiService = TestBed.inject(ThreadDataBackendApiService);
    userService = TestBed.inject(UserService);
    windowRef = TestBed.inject(WindowRef);
    pageContextService = TestBed.inject(PageContextService);
    feedbackBackendApiService = TestBed.inject(FeedbackBackendApiService);
    userExplorationPermissionsService = TestBed.inject(
      UserExplorationPermissionsService
    );
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);

    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve({
        isLoggedIn: () => true,
      } as UserInfo)
    );
    spyOn(
      userExplorationPermissionsService,
      'getPermissionsAsync'
    ).and.returnValue(
      Promise.resolve({
        canEdit: true,
      })
    );
    spyOn(
      threadDataBackendApiService,
      'getFeedbackThreadsAsync'
    ).and.returnValue(Promise.resolve({} as FeedbackThread[]));

    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should get threads after feedback threads are available', fakeAsync(() => {
    let onFeedbackThreadsInitializedEmitter = new EventEmitter();
    spyOnProperty(
      threadDataBackendApiService,
      'onFeedbackThreadsInitialized'
    ).and.returnValue(onFeedbackThreadsInitializedEmitter);
    spyOn(threadDataBackendApiService, 'getThread').and.stub();
    spyOn(component, 'fetchUpdatedThreads');

    component.ngOnInit();
    tick();

    onFeedbackThreadsInitializedEmitter.emit();

    expect(component.fetchUpdatedThreads).toHaveBeenCalled();
  }));

  it('should throw an error when trying to active a non-existent thread', () => {
    expect(() => {
      component.setActiveThread('0');
    }).toThrowError('Trying to display a non-existent thread');
  });

  it('should set active thread when it exists', fakeAsync(() => {
    let thread = SuggestionThread.createFromBackendDicts(
      {
        status: 'review',
        subject: '',
        summary: '',
        original_author_username: 'Username1',
        last_updated_msecs: 0,
        message_count: 1,
        thread_id: '1',
        state_name: '',
        last_nonempty_message_author: '',
        last_nonempty_message_text: '',
      },
      {
        suggestion_type: 'edit_exploration_state_content',
        suggestion_id: '1',
        target_type: '',
        target_id: '',
        status: '',
        author_name: '',
        change_cmd: {
          state_name: '',
          new_value: {html: ''},
          old_value: {html: ''},
          skill_id: '',
          content_id: '',
        },
        last_updated_msecs: 0,
      }
    );
    spyOn(threadDataBackendApiService, 'getThread').and.returnValue(thread);
    spyOn(threadDataBackendApiService, 'getMessagesAsync').and.returnValue(
      Promise.resolve(null)
    );

    component.setActiveThread('1');
    tick();

    expect(component.activeThread).toEqual(thread);
    expect(component.feedbackMessage.status).toBe('review');
  }));

  it('should throw error when trying to add message to non-existent thread', () => {
    expect(() => {
      component.addNewMessage('', 'Text', 'Open');
    }).toThrowError('Trying to add message to a non-existent thread.');
  });

  it('should add warning when trying to add a invalid message in a thread', () => {
    let addWarningSpy = spyOn(alertsService, 'addWarning').and.callThrough();
    component.addNewMessage('0', 'Text', '');
    expect(addWarningSpy).toHaveBeenCalledWith('Invalid message status: ');
  });

  it('should add warning when trying to add a message in a thread with id null', () => {
    let addWarningSpy = spyOn(alertsService, 'addWarning').and.callThrough();

    component.addNewMessage(null as never, 'Text', 'Open');

    expect(addWarningSpy).toHaveBeenCalledWith(
      'Cannot add message to thread with ID: null.'
    );
  });

  it('should throw error when trying to add a message in an invalid thread', () => {
    expect(() => {
      component.addNewMessage('0', 'Text', 'Open');
    }).toThrowError('Trying to add message to a non-existent thread.');
    expect(component.threadIsStale).toBe(true);
    expect(component.messageSendingInProgress).toBe(true);
  });

  it(
    'should add new message to a thread and then go back to feedback' +
      ' threads list',
    fakeAsync(() => {
      spyOn(threadDataBackendApiService, 'getThread').and.returnValue(
        SuggestionThread.createFromBackendDicts(
          {
            status: 'Open',
            subject: '',
            summary: '',
            original_author_username: 'Username1',
            last_updated_msecs: 0,
            message_count: 1,
            thread_id: '1',
            state_name: '',
            last_nonempty_message_author: '',
            last_nonempty_message_text: '',
          },
          {
            suggestion_type: 'edit_exploration_state_content',
            suggestion_id: '1',
            target_type: '',
            target_id: '',
            status: '',
            author_name: '',
            change_cmd: {
              state_name: '',
              new_value: {html: ''},
              old_value: {html: ''},
              skill_id: '',
              content_id: '',
            },
            last_updated_msecs: 0,
          }
        )
      );
      spyOn(threadDataBackendApiService, 'getMessagesAsync').and.returnValue(
        Promise.resolve(null)
      );

      component.setActiveThread('1');
      tick();

      spyOn(threadDataBackendApiService, 'addNewMessageAsync').and.returnValue(
        Promise.resolve(null)
      );

      component.addNewMessage('1', 'Text', 'Open');
      tick();

      expect(component.messageSendingInProgress).toBe(false);
      expect(component.messageSendingInProgress).toBe(false);
      expect(component.feedbackMessage.status).toBe('Open');
      expect(component.feedbackMessage.text).toBe('');

      component.onBackButtonClicked();
      tick();

      expect(threadDataBackendApiService.getThread).toHaveBeenCalledWith('1');
    })
  );

  it('should use reject handler when trying to add a message in a thread fails', fakeAsync(() => {
    spyOn(threadDataBackendApiService, 'getThread').and.returnValue(
      SuggestionThread.createFromBackendDicts(
        {
          status: 'Open',
          subject: '',
          summary: '',
          original_author_username: 'Username1',
          last_updated_msecs: 0,
          message_count: 1,
          thread_id: '1',
          state_name: '',
          last_nonempty_message_author: '',
          last_nonempty_message_text: '',
        },
        {
          suggestion_type: 'edit_exploration_state_content',
          suggestion_id: '1',
          target_type: '',
          target_id: '',
          status: '',
          author_name: '',
          change_cmd: {
            state_name: '',
            new_value: {html: ''},
            old_value: {html: ''},
            skill_id: '',
            content_id: '',
          },
          last_updated_msecs: 0,
        }
      )
    );
    spyOn(threadDataBackendApiService, 'getMessagesAsync').and.returnValue(
      Promise.resolve(null)
    );

    component.setActiveThread('1');
    tick();

    spyOn(threadDataBackendApiService, 'addNewMessageAsync').and.returnValue(
      Promise.reject()
    );

    component.addNewMessage('1', 'Text', 'Open');
    tick();

    expect(component.messageSendingInProgress).toBe(false);
  }));

  it(
    'should evaluate suggestion button type to be default when a feedback' +
      ' thread is selected',
    () => {
      let thread = SuggestionThread.createFromBackendDicts(
        {
          status: 'open',
          subject: '',
          summary: '',
          original_author_username: 'Username1',
          last_updated_msecs: 0,
          message_count: 1,
          thread_id: '1',
          state_name: '',
          last_nonempty_message_author: '',
          last_nonempty_message_text: '',
        },
        {
          suggestion_type: 'edit_exploration_state_content',
          suggestion_id: '1',
          target_type: '',
          target_id: '',
          status: 'open',
          author_name: '',
          change_cmd: {
            state_name: '',
            new_value: {html: ''},
            old_value: {html: ''},
            skill_id: '',
            content_id: '',
          },
          last_updated_msecs: 0,
        }
      );
      spyOn(threadDataBackendApiService, 'getThread').and.returnValue(thread);
      spyOn(threadDataBackendApiService, 'getMessagesAsync').and.returnValue(
        Promise.resolve(null)
      );

      component.setActiveThread('1');

      expect(component.getSuggestionButtonType()).toBe('default');
    }
  );

  it(
    'should evaluate suggestion button type to be primary when a feedback' +
      ' thread is selected',
    fakeAsync(() => {
      let thread = SuggestionThread.createFromBackendDicts(
        {
          status: 'review',
          subject: '',
          summary: '',
          original_author_username: 'Username1',
          last_updated_msecs: 0,
          message_count: 1,
          thread_id: '1',
          state_name: '',
          last_nonempty_message_author: '',
          last_nonempty_message_text: '',
        },
        {
          suggestion_type: 'edit_exploration_state_content',
          suggestion_id: '1',
          target_type: '',
          target_id: '',
          status: 'review',
          author_name: '',
          change_cmd: {
            state_name: 'Introduction',
            new_value: {html: ''},
            old_value: {html: ''},
            skill_id: '',
            content_id: '',
          },
          last_updated_msecs: 0,
        }
      );
      spyOn(threadDataBackendApiService, 'getThread').and.returnValue(thread);
      spyOn(threadDataBackendApiService, 'getMessagesAsync').and.returnValue(
        Promise.resolve(null)
      );

      component.setActiveThread('1');
      tick();

      spyOn(explorationStatesService, 'hasState').and.returnValue(true);
      spyOn(changeListService, 'getChangeList').and.returnValue([]);

      expect(component.getSuggestionButtonType()).toBe('primary');
    })
  );

  it('should call fetchUpdatedThreads', fakeAsync(() => {
    component.activeThread = SuggestionThread.createFromBackendDicts(
      {
        status: 'review',
        subject: '',
        summary: '',
        original_author_username: 'Username1',
        last_updated_msecs: 0,
        message_count: 1,
        thread_id: '1',
        state_name: '',
        last_nonempty_message_author: '',
        last_nonempty_message_text: '',
      },
      {
        suggestion_type: 'edit_exploration_state_content',
        suggestion_id: '1',
        target_type: '',
        target_id: '2',
        status: '',
        author_name: '',
        change_cmd: {
          state_name: '',
          new_value: {html: ''},
          old_value: {html: ''},
          skill_id: '',
          content_id: '',
        },
        last_updated_msecs: 0,
      }
    );

    spyOn(threadDataBackendApiService, 'getThread').and.returnValue(null);
    component.fetchUpdatedThreads().then(() => {});
    tick();

    expect(threadDataBackendApiService.getThread).toHaveBeenCalled();
  }));

  it('should create a new thread when closing create new thread modal', fakeAsync(() => {
    // Use 'unknown' (rather than 'any') because the spy is only stubbing the
    // return value; the actual argument types are irrelevant here. 'unknown'
    // preserves type safety by requiring an explicit cast before the values
    // could be used, while still accepting any argument.
    spyOn(ngbModal, 'open').and.callFake((dlg: unknown, opt: unknown) => {
      return {
        result: Promise.resolve({
          newThreadSubject: 'New subject',
          newThreadText: 'New text',
        }),
      } as NgbModalRef;
    });
    spyOn(alertsService, 'addSuccessMessage').and.callThrough();
    spyOn(threadDataBackendApiService, 'createNewThreadAsync').and.returnValue(
      Promise.resolve()
    );

    component.showCreateThreadModal();
    tick();
    tick();

    expect(
      threadDataBackendApiService.createNewThreadAsync
    ).toHaveBeenCalledWith('New subject', 'New text');
    expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
      'Feedback thread created.'
    );
    expect(component.feedbackMessage.status).toBe(null);
    expect(component.feedbackMessage.text).toBe('');
  }));

  it('should not create a new thread when dismissing create new thread modal', () => {
    spyOn(threadDataBackendApiService, 'createNewThreadAsync');
    // Use 'unknown' (rather than 'any') because the spy is only stubbing the
    // return value; the actual argument types are irrelevant here. 'unknown'
    // preserves type safety by requiring an explicit cast before the values
    // could be used, while still accepting any argument.
    spyOn(ngbModal, 'open').and.callFake((dlg: unknown, opt: unknown) => {
      return {
        result: Promise.reject(),
      } as NgbModalRef;
    });
    component.showCreateThreadModal();

    expect(
      threadDataBackendApiService.createNewThreadAsync
    ).not.toHaveBeenCalled();
  });

  it('should handle failure when creating a new thread fails', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.callFake((dlg: unknown, opt: unknown) => {
      return {
        result: Promise.resolve({
          newThreadSubject: 'New subject',
          newThreadText: 'New text',
        }),
      } as NgbModalRef;
    });

    spyOn(threadDataBackendApiService, 'createNewThreadAsync').and.returnValue(
      Promise.reject()
    );

    component.showCreateThreadModal();
    tick();
    tick();

    expect(
      threadDataBackendApiService.createNewThreadAsync
    ).toHaveBeenCalledWith('New subject', 'New text');
  }));

  it('should get css classes based on status', () => {
    expect(component.getLabelClass('open')).toBe('badge bg-info');
    expect(component.getLabelClass('compliment')).toBe('badge bg-success');
    expect(component.getLabelClass('another')).toBe('badge bg-secondary');
  });

  it('should get human readable status from provided status', () => {
    expect(component.getHumanReadableStatus('open')).toBe('Open');
    expect(component.getHumanReadableStatus('compliment')).toBe('Compliment');
    expect(component.getHumanReadableStatus('not_actionable')).toBe(
      'Not Actionable'
    );
  });

  it('should get formatted date string from the timestamp in milliseconds', () => {
    // This method is being spied to avoid any timezone issues.
    spyOn(
      dateTimeFormatService,
      'getLocaleAbbreviatedDatetimeString'
    ).and.returnValue('11/21/14');
    // This corresponds to Fri, 21 Nov 2014 09:45:00 GMT.
    let NOW_MILLIS = 1416563100000;
    expect(component.getLocaleAbbreviatedDatetimeString(NOW_MILLIS)).toBe(
      '11/21/14'
    );
  });

  it('should evaluate if exploration is editable', () => {
    let isEditableSpy = spyOn(editabilityService, 'isEditable');

    isEditableSpy.and.returnValue(true);
    expect(component.isExplorationEditable()).toBe(true);

    isEditableSpy.and.returnValue(false);
    expect(component.isExplorationEditable()).toBe(false);
  });

  it('should show new feedback tab when user has editing permission and feature flag is enabled', () => {
    component.newCreatorFeedbackTabIsEnabled = true;
    component.userCanEditExploration = true;

    expect(component.shouldShowNewCreatorFeedbackTab()).toBe(true);
  });

  it('should return true when Lesson Feedback filter is selected', () => {
    component.currentCreatorFeedbackFilterState.creatorFeedbackType =
      CreatorFeedbackType.FEEDBACK;

    expect(component.isCreatorLessonFeedbackFilterSelected()).toBe(true);
  });

  it('should return correct status options', () => {
    expect(component.statusOptions).toEqual(
      CREATOR_DASHBOARD_FILTER_CONFIG.statusOptions
    );
  });

  it('should return lesson feedback card config when lesson feedback is selected', () => {
    component.currentCreatorFeedbackFilterState.creatorFeedbackType =
      CreatorFeedbackType.FEEDBACK;

    expect(component.getCreatorFeedbackDetailCardConfig()).toBe(
      component.creatorLessonFeedbackCardConfig
    );
  });

  it('should return report feedback card config when lesson issue is selected', () => {
    component.currentCreatorFeedbackFilterState.creatorFeedbackType =
      CreatorFeedbackType.REPORT;

    expect(component.getCreatorFeedbackDetailCardConfig()).toBe(
      component.creatorReportFeedbackCardConfig
    );
  });

  it('should navigate to lesson feedback detail when lesson feedback row is clicked', () => {
    const mockWindow = createWindowWithHash();
    spyOnProperty(windowRef, 'nativeWindow', 'get').and.returnValue(mockWindow);
    component.currentCreatorFeedbackFilterState.creatorFeedbackType =
      CreatorFeedbackType.FEEDBACK;

    component.onCreatorFeedbackRowClick('feedback_id');

    expect(component.selectedCreatorFeedbackId).toBe('feedback_id');
    expect(mockWindow.location.hash).toBe(
      '#/feedback/lesson_feedback/feedback_id'
    );
  });

  it('should navigate to lesson issue detail when report row is clicked', () => {
    const mockWindow = createWindowWithHash();
    spyOnProperty(windowRef, 'nativeWindow', 'get').and.returnValue(mockWindow);
    component.currentCreatorFeedbackFilterState.creatorFeedbackType =
      CreatorFeedbackType.REPORT;

    component.onCreatorFeedbackRowClick('feedback_id');

    expect(component.selectedCreatorFeedbackId).toBe('feedback_id');
    expect(mockWindow.location.hash).toBe(
      '#/feedback/lesson_issue/feedback_id'
    );
  });

  it('should return lesson feedback current page', () => {
    component.currentCreatorFeedbackFilterState.creatorFeedbackType =
      CreatorFeedbackType.FEEDBACK;
    component.creatorLessonFeedbackListState.currentPage = 3;

    expect(component.getCreatorFeedbackListCurrentPage()).toBe(3);
  });

  it('should return report feedback current page', () => {
    component.currentCreatorFeedbackFilterState.creatorFeedbackType =
      CreatorFeedbackType.REPORT;
    component.creatorReportFeedbackListState.currentPage = 5;

    expect(component.getCreatorFeedbackListCurrentPage()).toBe(5);
  });

  it('should return lesson feedback more available state', () => {
    component.currentCreatorFeedbackFilterState.creatorFeedbackType =
      CreatorFeedbackType.FEEDBACK;
    component.creatorLessonFeedbackListState.moreAvailable = true;

    expect(component.getCreatorFeedbackListMoreAvailable()).toBeTrue();
  });

  it('should return report feedback more available state', () => {
    component.currentCreatorFeedbackFilterState.creatorFeedbackType =
      CreatorFeedbackType.REPORT;
    component.creatorReportFeedbackListState.moreAvailable = false;

    expect(component.getCreatorFeedbackListMoreAvailable()).toBeFalse();
  });

  it('should navigate back to creator feedback list', () => {
    const mockWindow = createWindowWithHash();
    spyOnProperty(windowRef, 'nativeWindow', 'get').and.returnValue(mockWindow);
    component.selectedCreatorFeedbackId = 'feedback_id';
    mockWindow.location.hash = '#/feedback/lesson_feedback/feedback_id';

    component.navigateBackToCreatorFeedbackList();
    expect(mockWindow.location.hash).toBe('#/feedback');
  });

  it('should fetch next page of lesson feedback', fakeAsync(() => {
    const response: LessonFeedbackBackendResponse = {
      summaries: [],
      next_cursor: null,
      more: false,
    };

    component.currentCreatorFeedbackFilterState.creatorFeedbackType =
      CreatorFeedbackType.FEEDBACK;

    component.creatorLessonFeedbackListState.currentPage = 1;
    component.creatorLessonFeedbackListState.moreAvailable = true;
    component.creatorLessonFeedbackListState.nextCursor = 'cursor';

    spyOn(
      feedbackBackendApiService,
      'fetchCreatorLessonFeedbackListAsync'
    ).and.returnValue(Promise.resolve(response));

    component.onCreatorFeedbackNextPage();
    tick();

    expect(
      feedbackBackendApiService.fetchCreatorLessonFeedbackListAsync
    ).toHaveBeenCalledWith(
      pageContextService.getExplorationId(),
      component.currentCreatorFeedbackFilterState,
      'cursor'
    );

    expect(component.creatorLessonFeedbackListState.currentPage).toBe(2);
    expect(component.creatorLessonFeedbackListState.cursorHistory).toEqual([
      null,
      'cursor',
    ]);
  }));

  it('should not fetch next page when no next page is available', () => {
    component.currentCreatorFeedbackFilterState.creatorFeedbackType =
      CreatorFeedbackType.FEEDBACK;

    component.creatorLessonFeedbackListState.moreAvailable = false;
    component.creatorLessonFeedbackListState.nextCursor = null;

    const fetchSpy = spyOn(
      feedbackBackendApiService,
      'fetchCreatorLessonFeedbackListAsync'
    );

    component.onCreatorFeedbackNextPage();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(component.creatorLessonFeedbackListState.currentPage).toBe(1);
    expect(component.creatorLessonFeedbackListState.cursorHistory).toEqual([
      null,
    ]);
  });

  it('should fetch previous page of lesson feedback', fakeAsync(() => {
    const response: LessonFeedbackBackendResponse = {
      summaries: [],
      next_cursor: 'cursor',
      more: true,
    };

    component.currentCreatorFeedbackFilterState.creatorFeedbackType =
      CreatorFeedbackType.FEEDBACK;

    component.creatorLessonFeedbackListState.currentPage = 2;
    component.creatorLessonFeedbackListState.cursorHistory = [null, 'cursor'];

    spyOn(
      feedbackBackendApiService,
      'fetchCreatorLessonFeedbackListAsync'
    ).and.returnValue(Promise.resolve(response));

    component.onCreatorFeedbackPreviousPage();
    tick();

    expect(
      feedbackBackendApiService.fetchCreatorLessonFeedbackListAsync
    ).toHaveBeenCalledWith(
      pageContextService.getExplorationId(),
      component.currentCreatorFeedbackFilterState,
      null
    );

    expect(component.creatorLessonFeedbackListState.currentPage).toBe(1);
  }));

  it('should not fetch previous page when already on first page', () => {
    component.currentCreatorFeedbackFilterState.creatorFeedbackType =
      CreatorFeedbackType.FEEDBACK;

    component.creatorLessonFeedbackListState.currentPage = 1;

    const fetchSpy = spyOn(
      feedbackBackendApiService,
      'fetchCreatorLessonFeedbackListAsync'
    );

    component.onCreatorFeedbackPreviousPage();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(component.creatorLessonFeedbackListState.currentPage).toBe(1);
  });

  it('should apply search locally when only search text changes', () => {
    const lessonFeedbackSummary: LessonFeedbackSummary = {
      id: 'id',
      feedback_text_preview: 'Need help with fractions',
      status: FeedbackStatus.OPEN,
      source: ReportType.LESSON,
      unread_response_count: 0,
    };

    component.currentCreatorFeedbackFilterState.creatorFeedbackType =
      CreatorFeedbackType.FEEDBACK;

    component.creatorLessonFeedbackListState.summaries = [
      lessonFeedbackSummary,
    ];
    component.creatorLessonFeedbackListState.displayedSummaries = [
      lessonFeedbackSummary,
    ];

    const fetchSpy = spyOn(
      feedbackBackendApiService,
      'fetchCreatorLessonFeedbackListAsync'
    );

    const filterState: FeedbackFilterState = {
      ...component.currentCreatorFeedbackFilterState,
      searchText: 'fraction',
    };

    component.onCreatorFeedbackFilterChange(filterState);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(component.creatorLessonFeedbackListState.displayedSummaries).toEqual(
      [lessonFeedbackSummary]
    );
  });

  it('should fetch lesson feedback when status filter changes', fakeAsync(() => {
    const response: LessonFeedbackBackendResponse = {
      summaries: [mockLessonFeedbackSummary],
      next_cursor: null,
      more: false,
    };

    component.currentCreatorFeedbackFilterState.creatorFeedbackType =
      CreatorFeedbackType.FEEDBACK;

    spyOn(
      feedbackBackendApiService,
      'fetchCreatorLessonFeedbackListAsync'
    ).and.returnValue(Promise.resolve(response));

    const filterState: FeedbackFilterState = {
      ...component.currentCreatorFeedbackFilterState,
      status: FeedbackStatus.FIXED,
    };

    component.onCreatorFeedbackFilterChange(filterState);
    tick();

    expect(
      feedbackBackendApiService.fetchCreatorLessonFeedbackListAsync
    ).toHaveBeenCalledWith(
      pageContextService.getExplorationId(),
      filterState,
      null
    );

    expect(component.currentCreatorFeedbackFilterState).toEqual(filterState);
    expect(component.creatorLessonFeedbackListState.currentPage).toBe(1);
  }));

  it('should return lesson feedback summaries', () => {
    component.currentCreatorFeedbackFilterState.creatorFeedbackType =
      CreatorFeedbackType.FEEDBACK;

    component.creatorLessonFeedbackListState.displayedSummaries = [
      mockLessonFeedbackSummary,
    ];

    expect(component.getDisplayedCreatorFeedbackSummaries()).toEqual([
      mockLessonFeedbackSummary,
    ]);
  });

  it('should return report feedback summaries', () => {
    component.currentCreatorFeedbackFilterState.creatorFeedbackType =
      CreatorFeedbackType.REPORT;

    component.creatorReportFeedbackListState.displayedSummaries = [
      mockPlatformFeedbackSummary,
    ];

    expect(component.getDisplayedCreatorFeedbackSummaries()).toEqual([
      mockPlatformFeedbackSummary,
    ]);
  });

  it('should apply search locally for report feedback', () => {
    component.currentCreatorFeedbackFilterState.creatorFeedbackType =
      CreatorFeedbackType.REPORT;

    component.creatorReportFeedbackListState.summaries = [
      mockPlatformFeedbackSummary,
    ];
    component.creatorReportFeedbackListState.displayedSummaries = [
      mockPlatformFeedbackSummary,
    ];

    const fetchSpy = spyOn(
      feedbackBackendApiService,
      'fetchCreatorDashboardFeedbackListAsync'
    );

    const filterState: FeedbackFilterState = {
      ...component.currentCreatorFeedbackFilterState,
      searchText: 'Platform',
    };

    component.onCreatorFeedbackFilterChange(filterState);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(component.creatorReportFeedbackListState.displayedSummaries).toEqual(
      [mockPlatformFeedbackSummary]
    );
  });

  it('should return displayed lesson feedback summaries', () => {
    component.currentCreatorFeedbackFilterState.creatorFeedbackType =
      CreatorFeedbackType.FEEDBACK;

    component.creatorLessonFeedbackListState.displayedSummaries = [
      mockLessonFeedbackSummary,
    ];

    expect(component.getDisplayedCreatorFeedbackSummaries()).toEqual([
      mockLessonFeedbackSummary,
    ]);
  });

  it('should return displayed report feedback summaries', () => {
    component.currentCreatorFeedbackFilterState.creatorFeedbackType =
      CreatorFeedbackType.REPORT;

    component.creatorReportFeedbackListState.displayedSummaries = [
      mockPlatformFeedbackSummary,
    ];

    expect(component.getDisplayedCreatorFeedbackSummaries()).toEqual([
      mockPlatformFeedbackSummary,
    ]);
  });

  it('should update lesson feedback status', fakeAsync(() => {
    component.currentCreatorFeedbackFilterState.creatorFeedbackType =
      CreatorFeedbackType.FEEDBACK;

    component.selectedCreatorFeedbackId = 'feedback_id';
    component.creatorFeedbackDetailResponse = mockLessonFeedbackDetailResponse;

    spyOn(
      feedbackBackendApiService,
      'updateLessonFeedbackAsync'
    ).and.returnValue(Promise.resolve({success: true}));

    spyOn(
      feedbackBackendApiService,
      'fetchCreatorLessonFeedbackListAsync'
    ).and.returnValue(
      Promise.resolve({
        summaries: [],
        next_cursor: null,
        more: false,
      })
    );

    spyOn(
      feedbackBackendApiService,
      'fetchLessonFeedbackDetailAsync'
    ).and.returnValue(Promise.resolve(mockLessonFeedbackDetailResponse));

    const successSpy = spyOn(alertsService, 'addSuccessMessage');

    component.onCreatorFeedbackStatusChange(FeedbackStatus.FIXED);
    tick();
    tick();

    expect(
      feedbackBackendApiService.updateLessonFeedbackAsync
    ).toHaveBeenCalledWith(
      pageContextService.getExplorationId(),
      'feedback_id',
      FeedbackStatus.FIXED,
      null
    );

    expect(successSpy).toHaveBeenCalledWith(
      'Feedback status updated to fixed.',
      7000,
      true
    );
  }));

  it('should send lesson feedback reply', fakeAsync(() => {
    component.currentCreatorFeedbackFilterState.creatorFeedbackType =
      CreatorFeedbackType.FEEDBACK;

    component.selectedCreatorFeedbackId = 'feedback_id';
    component.creatorFeedbackDetailResponse = mockLessonFeedbackDetailResponse;

    spyOn(
      feedbackBackendApiService,
      'updateLessonFeedbackAsync'
    ).and.returnValue(Promise.resolve(mockSuccessResponse));

    spyOn(
      feedbackBackendApiService,
      'fetchCreatorLessonFeedbackListAsync'
    ).and.returnValue(
      Promise.resolve({
        summaries: [],
        next_cursor: null,
        more: false,
      })
    );

    spyOn(
      feedbackBackendApiService,
      'fetchLessonFeedbackDetailAsync'
    ).and.returnValue(Promise.resolve(mockLessonFeedbackDetailResponse));

    const successSpy = spyOn(alertsService, 'addSuccessMessage');

    component.onCreatorFeedbackMessageSend('Thanks for your feedback!');
    tick();
    tick();

    expect(
      feedbackBackendApiService.updateLessonFeedbackAsync
    ).toHaveBeenCalledWith(
      pageContextService.getExplorationId(),
      'feedback_id',
      FeedbackStatus.OPEN,
      'Thanks for your feedback!'
    );

    expect(successSpy).toHaveBeenCalledWith(
      'Reply sent successfully.',
      7000,
      true
    );
  }));

  it('should update report feedback status', fakeAsync(() => {
    component.currentCreatorFeedbackFilterState.creatorFeedbackType =
      CreatorFeedbackType.REPORT;

    component.selectedCreatorFeedbackId = 'report_id';
    component.creatorFeedbackDetailResponse =
      mockPlatformFeedbackDetailResponse;

    spyOn(
      feedbackBackendApiService,
      'updatePlatformFeedbackStatusAsync'
    ).and.returnValue(Promise.resolve({success: true}));

    spyOn(
      feedbackBackendApiService,
      'fetchCreatorDashboardFeedbackListAsync'
    ).and.returnValue(
      Promise.resolve({
        summaries: [],
        next_cursor: null,
        more: false,
      })
    );

    spyOn(
      feedbackBackendApiService,
      'fetchPlatformFeedbackDetailAsync'
    ).and.returnValue(Promise.resolve(mockPlatformFeedbackDetailResponse));

    const successSpy = spyOn(alertsService, 'addSuccessMessage');

    component.onCreatorFeedbackStatusChange(FeedbackStatus.FIXED);
    tick();
    tick();

    expect(
      feedbackBackendApiService.updatePlatformFeedbackStatusAsync
    ).toHaveBeenCalledWith(
      'curriculum',
      pageContextService.getExplorationId(),
      'report_id',
      FeedbackStatus.FIXED
    );

    expect(successSpy).toHaveBeenCalledWith(
      'Feedback status updated to fixed.',
      7000,
      true
    );
  }));

  it('should load lesson feedback detail from URL on init', fakeAsync(() => {
    const mockWindow = createWindowWithHash();
    spyOnProperty(windowRef, 'nativeWindow', 'get').and.returnValue(mockWindow);
    tick();
    mockWindow.location.hash = '#/feedback/lesson_feedback/feedback_id';

    spyOn(
      feedbackBackendApiService,
      'fetchLessonFeedbackDetailAsync'
    ).and.returnValue(Promise.resolve(mockLessonFeedbackDetailResponse));
    mockPlatformFeatureService.status.ExplorationEditorNewCreatorFeedbackTab.isEnabled =
      true;
    component.ngOnInit();
    tick();
    tick();

    expect(
      feedbackBackendApiService.fetchLessonFeedbackDetailAsync
    ).toHaveBeenCalledWith(
      pageContextService.getExplorationId(),
      'feedback_id'
    );
  }));

  it('should return creator feedback detail from URL', () => {
    const mockWindow = createWindowWithHash();
    spyOnProperty(windowRef, 'nativeWindow', 'get').and.returnValue(mockWindow);
    mockWindow.location.hash = '#/feedback/lesson_feedback/feedback%20id';

    expect(component.getCreatorFeedbackDetailFromUrl()).toEqual({
      feedbackType: FeedbackModalType.LESSON_FEEDBACK,
      feedbackId: 'feedback id',
    });
  });

  it('should return null when URL is not a creator feedback detail URL', () => {
    const mockWindow = createWindowWithHash();
    spyOnProperty(windowRef, 'nativeWindow', 'get').and.returnValue(mockWindow);
    mockWindow.location.hash = '#/feedback';

    expect(component.getCreatorFeedbackDetailFromUrl()).toBeNull();
  });

  it('should clear stale creator feedback detail when URL has no detail', () => {
    const mockWindow = createWindowWithHash();
    spyOnProperty(windowRef, 'nativeWindow', 'get').and.returnValue(mockWindow);

    component.selectedCreatorFeedbackId = 'feedback_id';
    component.creatorFeedbackDetailResponse = mockLessonFeedbackDetailResponse;
    component.creatorFeedbackScreenshotDataUrl = 'image-url';
    mockWindow.location.hash = '#/feedback';

    component.syncCreatorFeedbackFromUrl();

    expect(component.selectedCreatorFeedbackId).toBeNull();
    expect(component.creatorFeedbackDetailResponse).toBeNull();
    expect(component.creatorFeedbackScreenshotDataUrl).toBeNull();
  });
  it('should do nothing when sending reply without selected feedback', () => {
    component.selectedCreatorFeedbackId = null;
    component.creatorFeedbackDetailResponse = null;

    const spy = spyOn(feedbackBackendApiService, 'updateLessonFeedbackAsync');

    component.onCreatorFeedbackMessageSend('reply');

    expect(spy).not.toHaveBeenCalled();
  });

  it('should not update lesson feedback status when no feedback is selected', () => {
    component.currentCreatorFeedbackFilterState.creatorFeedbackType =
      CreatorFeedbackType.FEEDBACK;

    component.selectedCreatorFeedbackId = null;
    component.creatorFeedbackDetailResponse = null;

    const spy = spyOn(feedbackBackendApiService, 'updateLessonFeedbackAsync');

    component.onCreatorFeedbackStatusChange(FeedbackStatus.FIXED);

    expect(spy).not.toHaveBeenCalled();
  });

  it('should not update report feedback status when no feedback is selected', () => {
    component.currentCreatorFeedbackFilterState.creatorFeedbackType =
      CreatorFeedbackType.REPORT;

    component.selectedCreatorFeedbackId = null;
    component.creatorFeedbackDetailResponse = null;

    const spy = spyOn(
      feedbackBackendApiService,
      'updatePlatformFeedbackStatusAsync'
    );

    component.onCreatorFeedbackStatusChange(FeedbackStatus.FIXED);

    expect(spy).not.toHaveBeenCalled();
  });

  it('should load report feedback detail when report row is clicked', fakeAsync(() => {
    const mockWindow = createWindowWithHash();
    spyOnProperty(windowRef, 'nativeWindow', 'get').and.returnValue(mockWindow);

    mockPlatformFeatureService.status.ExplorationEditorNewCreatorFeedbackTab.isEnabled =
      true;
    component.ngOnInit();
    tick();
    tick();

    component.currentCreatorFeedbackFilterState.creatorFeedbackType =
      CreatorFeedbackType.REPORT;

    spyOn(
      feedbackBackendApiService,
      'fetchPlatformFeedbackDetailAsync'
    ).and.returnValue(Promise.resolve(mockPlatformFeedbackDetailResponse));

    spyOn(assetsBackendApiService, 'getImageUrlForPreview').and.returnValue(
      'image-url'
    );

    component.onCreatorFeedbackRowClick('report_id');
    mockWindow.triggerHashChange();
    tick();

    expect(
      feedbackBackendApiService.fetchPlatformFeedbackDetailAsync
    ).toHaveBeenCalledWith(
      'curriculum',
      pageContextService.getExplorationId(),
      'report_id'
    );

    expect(component.selectedCreatorFeedbackId).toBe('report_id');
    expect(component.creatorFeedbackScreenshotDataUrl).toBe('image-url');
  }));
});
