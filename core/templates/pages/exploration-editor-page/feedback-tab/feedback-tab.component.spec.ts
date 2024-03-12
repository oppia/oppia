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
import {FeedbackThread} from 'domain/feedback_thread/FeedbackThreadObjectFactory';

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
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
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

    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve({
        isLoggedIn: () => true,
      } as UserInfo)
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

  it(
    'should add warning when trying to add a message in a thread with id' +
      ' null',
    () => {
      let addWarningSpy = spyOn(alertsService, 'addWarning').and.callThrough();
      component.addNewMessage(null, 'Text', 'Open');
      expect(addWarningSpy).toHaveBeenCalledWith(
        'Cannot add message to thread with ID: null.'
      );
    }
  );

  it('should add warning when trying to add a invalid message in a thread', () => {
    let addWarningSpy = spyOn(alertsService, 'addWarning').and.callThrough();
    component.addNewMessage('0', 'Text', null);
    expect(addWarningSpy).toHaveBeenCalledWith('Invalid message status: null');
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
            state_name: '',
            new_value: {html: ''},
            old_value: {html: ''},
            skill_id: '',
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
    spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
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
    spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return {
        result: Promise.reject(),
      } as NgbModalRef;
    });
    component.showCreateThreadModal();

    expect(
      threadDataBackendApiService.createNewThreadAsync
    ).not.toHaveBeenCalled();
  });

  it('should get css classes based on status', () => {
    expect(component.getLabelClass('open')).toBe('badge badge-info');
    expect(component.getLabelClass('compliment')).toBe('badge badge-success');
    expect(component.getLabelClass('another')).toBe('badge badge-secondary');
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
});
