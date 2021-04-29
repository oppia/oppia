// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ThreadDataBackendApiService,
 * which retrieves thread data for the feedback tab of the exploration editor.
 */

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { FeedbackThreadObjectFactory } from 'domain/feedback_thread/FeedbackThreadObjectFactory';
import { SuggestionThreadObjectFactory } from 'domain/suggestion/SuggestionThreadObjectFactory';
import { ThreadDataBackendApiService } from 'pages/exploration-editor-page/feedback-tab/services/thread-data-backend-api.service';
import { ContextService } from 'services/context.service';
import { CsrfTokenService } from 'services/csrf-token.service';

describe('retrieving threads service', () => {
  let httpTestingController = null;
  let contextService = null;
  let csrfTokenService = null;
  let feedbackThreadObjectFactory = null;
  let suggestionThreadObjectFactory = null;
  let threadDataBackendApiService = null;

  let mockFeedbackThreads;
  let mockSuggestionThreads;
  let mockSuggestions;
  let mockMessages;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  beforeEach(() => {
    mockFeedbackThreads = [
      {
        last_updated: 1441870501230.642,
        original_author_username: 'test_learner',
        state_name: null,
        status: 'open',
        subject: 'Feedback from a learner',
        summary: null,
        thread_id: 'exploration.exp1.abc1'
      },
      {
        last_updated: 1441870501231.642,
        original_author_username: 'test_learner',
        state_name: null,
        status: 'open',
        subject: 'Feedback from a learner',
        summary: null,
        thread_id: 'exploration.exp1.def2'
      }
    ];
    mockSuggestionThreads = [
      {
        description: 'Suggestion',
        last_updated: 1441870501231.642,
        original_author_username: 'test_learner',
        state_name: null,
        status: 'open',
        subject: 'Suggestion from a learner',
        summary: null,
        thread_id: 'exploration.exp1.ghi3'
      }
    ];
    mockSuggestions = [
      {
        assigned_reviewer_id: null,
        author_name: 'author_1',
        change: {
          new_value: {
            html: 'new content html',
            audio_translation: {}
          },
          old_value: null,
          cmd: 'edit_state_property',
          state_name: 'state_1',
          property_name: 'content'
        },
        final_reviewer_id: null,
        last_updated: 1528564605944.896,
        score_category: 'content.Algebra',
        status: 'received',
        suggestion_id: 'exploration.exp1.ghi3',
        suggestion_type: 'edit_exploration_state_content',
        target_id: 'exp1',
        target_type: 'exploration',
        target_version_at_submission: 1,
      }
    ];
    mockMessages = [
      {
        author_username: 'author',
        created_on_msecs: 1000,
        entity_type: 'exploration',
        entity_id: 'exploration.exp1.abc1',
        message_id: 0,
        text: '1st message',
        updated_status: null,
        updated_subject: null
      },
      {
        author_username: 'author',
        created_on_msecs: 1200,
        entity_type: 'exploration',
        entity_id: 'exploration.exp1.abc1',
        message_id: 1,
        text: '2nd message',
        updated_status: null,
        updated_subject: null
      }
    ];
  });

  beforeEach(() => {
    contextService = TestBed.get(ContextService);
    csrfTokenService = TestBed.get(CsrfTokenService);
    feedbackThreadObjectFactory = TestBed.get(FeedbackThreadObjectFactory);
    suggestionThreadObjectFactory = TestBed.get(SuggestionThreadObjectFactory);
    threadDataBackendApiService = TestBed.get(ThreadDataBackendApiService);

    spyOn(contextService, 'getExplorationId').and.returnValue('exp1');
    spyOn(csrfTokenService, 'getTokenAsync')
      .and.returnValue(Promise.resolve('sample-csrf-token'));
  });

  it('should retrieve feedback threads and suggestion thread', fakeAsync(() => {
    threadDataBackendApiService.getThreadsAsync().then(
      threadData => {
        for (let mockFeedbackThread of mockFeedbackThreads) {
          expect(threadDataBackendApiService.getThread(
            mockFeedbackThread.thread_id)).not.toBeNull();
        }
        for (let mockSuggestionThread of mockSuggestionThreads) {
          expect(threadDataBackendApiService.getThread(
            mockSuggestionThread.thread_id)).not.toBeNull();
        }
      });

    let req = httpTestingController.expectOne('/threadlisthandler/exp1');
    expect(req.request.method).toEqual('GET');
    req.flush({
      feedback_thread_dicts: mockFeedbackThreads,
      suggestion_thread_dicts: mockSuggestionThreads
    });

    req = httpTestingController.expectOne(
      '/suggestionlisthandler?target_type=exploration&target_id=exp1');
    expect(req.request.method).toEqual('GET');
    req.flush({ suggestions: mockSuggestions });

    flushMicrotasks();
  }));

  it('should call reject handler if any thread is null', fakeAsync(() => {
    threadDataBackendApiService.getThreadsAsync().then(
      Promise.reject,
      error => {
        expect(error).toMatch('Missing input backend dict');
        Promise.resolve();
      });

    let req = httpTestingController.expectOne('/threadlisthandler/exp1');
    expect(req.request.method).toEqual('GET');
    req.flush({
      feedback_thread_dicts: [null],
      suggestion_thread_dicts: []
    });

    req = httpTestingController.expectOne(
      '/suggestionlisthandler?target_type=exploration&target_id=exp1');
    expect(req.request.method).toEqual('GET');
    req.flush({ suggestions: [] });

    flushMicrotasks();

    threadDataBackendApiService.getThreadsAsync().then(
      Promise.reject,
      error => {
        expect(error).toMatch('Missing input backend dict');
        Promise.resolve();
      });

    req = httpTestingController.expectOne('/threadlisthandler/exp1');
    expect(req.request.method).toEqual('GET');
    req.flush({
      feedback_thread_dicts: [],
      suggestion_thread_dicts: [null]
    });

    req = httpTestingController.expectOne(
      '/suggestionlisthandler?target_type=exploration&target_id=exp1');
    expect(req.request.method).toEqual('GET');
    req.flush({ suggestions: mockSuggestions });

    flushMicrotasks();
  }));

  it('should call reject handler if suggestions are missing', fakeAsync(() => {
    threadDataBackendApiService.getThreadsAsync().then(
      Promise.reject,
      error => {
        expect(error).toMatch('Missing input backend dict');
        Promise.resolve();
      });

    let req = httpTestingController.expectOne('/threadlisthandler/exp1');
    expect(req.request.method).toEqual('GET');
    req.flush({
      feedback_thread_dicts: [],
      suggestion_thread_dicts: mockSuggestionThreads
    });

    req = httpTestingController.expectOne(
      '/suggestionlisthandler?target_type=exploration&target_id=exp1');
    expect(req.request.method).toEqual('GET');
    req.flush({ suggestions: [] });

    flushMicrotasks();
  }));

  it(
    'should use reject handler whenever fetching feedback threads or ' +
    'suggestion threads fails', fakeAsync(() => {
      threadDataBackendApiService.getThreadsAsync().then(
        Promise.reject,
        error => {
          expect(error).toEqual('Error on retrieving feedback threads.');
          Promise.resolve();
        });

      let req = httpTestingController.expectOne(
        '/suggestionlisthandler?target_type=exploration&target_id=exp1');
      expect(req.request.method).toEqual('GET');
      req.flush({ suggestions: mockSuggestions });

      req = httpTestingController.expectOne('/threadlisthandler/exp1');
      expect(req.request.method).toEqual('GET');
      req.flush('Error on retrieving feedback threads.', {
        status: 500,
        statusText: 'Error on retrieving feedback threads.'
      });

      flushMicrotasks();
    }));

  it('should successfully fetch the messages of a thread', fakeAsync(() => {
    let mockThread = mockFeedbackThreads[0];
    let thread = feedbackThreadObjectFactory.createFromBackendDict(mockThread);

    let setMessagesSpy = spyOn(thread, 'setMessages').and.callThrough();

    threadDataBackendApiService.getMessagesAsync(thread).then(
      () => {
        expect(setMessagesSpy).toHaveBeenCalled();
        expect(thread.lastNonemptyMessageSummary.text).toEqual('2nd message');
        Promise.resolve();
      },
      Promise.reject);

    let req = httpTestingController.expectOne(
      '/threadhandler/exploration.exp1.abc1');
    expect(req.request.method).toEqual('GET');
    req.flush({ messages: mockMessages });

    flushMicrotasks();
  }));

  it('should throw error if trying to fetch messages of' +
    'null thread', async() => {
    await expectAsync(threadDataBackendApiService.getMessagesAsync(null))
      .toBeRejectedWithError('Trying to update a non-existent thread');
  });

  it(
    'should call reject handler when fetching messages fails',
    fakeAsync(() => {
      let mockThread = mockFeedbackThreads[0];
      let thread = feedbackThreadObjectFactory.createFromBackendDict(
        mockThread);

      let setMessagesSpy = spyOn(thread, 'setMessages').and.callThrough();

      threadDataBackendApiService.getMessagesAsync(thread).then(
        Promise.reject,
        error => {
          expect(error.error).toEqual(
            'Error on fetching messages from a thread.');
          expect(error.status).toEqual(500);
          expect(setMessagesSpy).not.toHaveBeenCalled();
          Promise.resolve();
        });

      let req = httpTestingController.expectOne(
        '/threadhandler/exploration.exp1.abc1');
      expect(req.request.method).toEqual('GET');
      req.flush('Error on fetching messages from a thread.', {
        status: 500,
        statusText: 'Error on fetching messages from a thread.'
      });

      flushMicrotasks();
    }));

  it('should successfully fetch feedback stats', fakeAsync(() => {
    threadDataBackendApiService.getOpenThreadsCountAsync().then(
      () => {
        expect(threadDataBackendApiService.getOpenThreadsCount()).toEqual(10);
        Promise.resolve();
      },
      Promise.reject);

    let req = httpTestingController.expectOne('/feedbackstatshandler/exp1');
    expect(req.request.method).toEqual('GET');
    req.flush({ num_open_threads: 10 });

    flushMicrotasks();
  }));

  it(
    'should use reject handler when fetching feedback stats fails',
    fakeAsync(() => {
      threadDataBackendApiService.getOpenThreadsCountAsync().then(
        Promise.reject,
        () => {
          expect(threadDataBackendApiService.getOpenThreadsCount()).toEqual(0);
          Promise.resolve();
        });

      let req = httpTestingController.expectOne('/feedbackstatshandler/exp1');
      expect(req.request.method).toEqual('GET');
      req.flush('Error on fetch feedback stats', {status: 500, statusText: ''});

      flushMicrotasks();
    }));

  it('should successfully create a new thread', fakeAsync(() => {
    let subject = 'New Subject';
    let mockCreatedFeedbackThread = {
      last_updated: 1441870501230.642,
      original_author_username: 'test_learner',
      state_name: null,
      status: 'open',
      subject: subject,
      summary: null,
      thread_id: 'exploration.exp1.jkl1'
    };

    expect(threadDataBackendApiService.getOpenThreadsCount()).toEqual(0);
    threadDataBackendApiService.createNewThreadAsync(subject, 'Text').then(
      threadData => {
        expect(threadData.feedbackThreads.length).toEqual(1);
        expect(threadData.feedbackThreads[0].threadId)
          .toEqual('exploration.exp1.jkl1');
        expect(threadDataBackendApiService.getOpenThreadsCount()).toEqual(1);
        Promise.resolve();
      },
      Promise.reject);

    let req = httpTestingController.expectOne('/threadlisthandler/exp1');
    expect(req.request.method).toEqual('POST');
    req.flush(null, { status: 200, statusText: '' });

    flushMicrotasks();

    req = httpTestingController.expectOne('/threadlisthandler/exp1');
    expect(req.request.method).toEqual('GET');
    req.flush({
      feedback_thread_dicts: [mockCreatedFeedbackThread],
      suggestion_thread_dicts: []
    });

    req = httpTestingController.expectOne(
      '/suggestionlisthandler?target_type=exploration&target_id=exp1');
    expect(req.request.method).toEqual('GET');
    req.flush({ suggestions: [] });

    flushMicrotasks();
  }));

  it(
    'should use reject handler when creating a new thread fails',
    fakeAsync(() => {
      expect(threadDataBackendApiService.getOpenThreadsCount()).toEqual(0);
      threadDataBackendApiService.createNewThreadAsync('Subject', 'Text');

      let req = httpTestingController.expectOne('/threadlisthandler/exp1');
      expect(req.request.method).toEqual('POST');
      req.flush(null, { status: 500, statusText: '' });

      flushMicrotasks();
      expect(threadDataBackendApiService.getOpenThreadsCount()).toEqual(0);
    }));

  it('should successfully mark thread as seen', fakeAsync(() => {
    let mockThread = mockFeedbackThreads[0];
    let thread = feedbackThreadObjectFactory.createFromBackendDict(mockThread);
    threadDataBackendApiService.markThreadAsSeenAsync(thread);

    let req = httpTestingController.expectOne(
      '/feedbackhandler/thread_view_event/exploration.exp1.abc1');
    expect(req.request.method).toEqual('POST');
    req.flush(null, { status: 200, statusText: '' });

    flushMicrotasks();
  }));

  it('should throw error if trying to mark null thread as seen', async() => {
    await expectAsync(threadDataBackendApiService.markThreadAsSeenAsync(null))
      .toBeRejectedWithError('Trying to update a non-existent thread');
  });

  it(
    'should use reject handler when marking thread as seen fails',
    fakeAsync(() => {
      let mockThread = mockFeedbackThreads[0];
      let thread = feedbackThreadObjectFactory.createFromBackendDict(
        mockThread);

      threadDataBackendApiService.markThreadAsSeenAsync(thread).then(
        Promise.reject,
        error => {
          expect(error.status).toEqual(500);
          Promise.resolve();
        });

      let req = httpTestingController.expectOne(
        '/feedbackhandler/thread_view_event/exploration.exp1.abc1');
      expect(req.request.method).toEqual('POST');
      req.flush(null, { status: 500, statusText: '' });

      flushMicrotasks();
    }));

  it('should use reject handler when passing a null thread', async() => {
    await expectAsync(threadDataBackendApiService.addNewMessageAsync(
      null, 'Message', 'open')).toBeRejectedWithError(
      'Trying to update a non-existent thread');
  });

  it(
    'should successfully add a new message in a thread when its status ' +
    'is different than old status and its status is close', fakeAsync(() => {
      let mockThread = mockFeedbackThreads[0];
      let thread = feedbackThreadObjectFactory.createFromBackendDict(
        mockThread);

      // Fetch feedback stats.
      threadDataBackendApiService.getOpenThreadsCountAsync();

      let req = httpTestingController.expectOne('/feedbackstatshandler/exp1');
      expect(req.request.method).toEqual('GET');
      req.flush({ num_open_threads: 1 });
      flushMicrotasks();
      expect(threadDataBackendApiService.getOpenThreadsCount()).toEqual(1);

      threadDataBackendApiService.addNewMessageAsync(
        thread, 'Message', 'close').then(() => {
        expect(threadDataBackendApiService.getOpenThreadsCount()).toEqual(0);
        Promise.resolve();
      },
      Promise.reject);

      req = httpTestingController.expectOne(
        '/threadhandler/exploration.exp1.abc1');
      expect(req.request.method).toEqual('POST');
      req.flush({messages: []});

      flushMicrotasks();
    }));

  it(
    'should successfully add a new message in a thread when its status ' +
    'is different of old status and its status is open', fakeAsync(() => {
      let mockThread = mockFeedbackThreads[0];
      mockThread.status = 'close';
      let thread = feedbackThreadObjectFactory.createFromBackendDict(
        mockThread);

      // Fetch feedback stats.
      threadDataBackendApiService.getOpenThreadsCountAsync();

      let req = httpTestingController.expectOne('/feedbackstatshandler/exp1');
      expect(req.request.method).toEqual('GET');
      req.flush({ num_open_threads: 1 });
      flushMicrotasks();
      expect(threadDataBackendApiService.getOpenThreadsCount()).toEqual(1);

      threadDataBackendApiService.addNewMessageAsync(
        thread, 'Message', 'open').then(() => {
        expect(threadDataBackendApiService.getOpenThreadsCount()).toEqual(2);
        Promise.resolve();
      },
      Promise.reject);

      req = httpTestingController.expectOne(
        '/threadhandler/exploration.exp1.abc1');
      expect(req.request.method).toEqual('POST');
      req.flush({messages: []});

      flushMicrotasks();
    }));

  it(
    'should successfully add a new message in a thread when its status ' +
    'is equal old status', fakeAsync(() => {
      let mockThread = mockFeedbackThreads[0];
      let thread = feedbackThreadObjectFactory.createFromBackendDict(
        mockThread);

      // Fetch feedback stats.
      threadDataBackendApiService.getOpenThreadsCountAsync();

      let req = httpTestingController.expectOne('/feedbackstatshandler/exp1');
      expect(req.request.method).toEqual('GET');
      req.flush({ num_open_threads: 1 });
      flushMicrotasks();
      expect(threadDataBackendApiService.getOpenThreadsCount()).toEqual(1);

      threadDataBackendApiService.addNewMessageAsync(
        thread, 'Message', 'open').then(() => {
        expect(threadDataBackendApiService.getOpenThreadsCount()).toEqual(1);
        Promise.resolve();
      },
      Promise.reject);

      req = httpTestingController.expectOne(
        '/threadhandler/exploration.exp1.abc1');
      expect(req.request.method).toEqual('POST');
      req.flush({messages: mockMessages});

      flushMicrotasks();
    }));

  it('should successfully resolve a suggestion', fakeAsync(() => {
    let thread = suggestionThreadObjectFactory.createFromBackendDicts(
      mockSuggestionThreads[0], mockSuggestions[0]);

    threadDataBackendApiService.getThreadsAsync();

    let req = httpTestingController.expectOne('/threadlisthandler/exp1');
    expect(req.request.method).toEqual('GET');
    req.flush({
      feedback_thread_dicts: [],
      suggestion_thread_dicts: mockSuggestionThreads
    });

    req = httpTestingController.expectOne(
      '/suggestionlisthandler?target_type=exploration&target_id=exp1');
    expect(req.request.method).toEqual('GET');
    req.flush({ suggestions: mockSuggestions });
    flushMicrotasks();

    threadDataBackendApiService.getOpenThreadsCountAsync();

    req = httpTestingController.expectOne('/feedbackstatshandler/exp1');
    expect(req.request.method).toEqual('GET');
    req.flush({num_open_threads: 1});
    flushMicrotasks();
    expect(threadDataBackendApiService.getOpenThreadsCount()).toEqual(1);

    threadDataBackendApiService.resolveSuggestionAsync(
      thread, 'Message', 'status', 'a', true)
      .then(() => {
        expect(threadDataBackendApiService.getOpenThreadsCount()).toEqual(0);
        Promise.resolve();
      },
      Promise.reject);

    req = httpTestingController.expectOne(
      '/suggestionactionhandler/exploration/exp1/exploration.exp1.ghi3');
    expect(req.request.method).toEqual('PUT');
    req.flush(null, { status: 200, statusText: '' });

    flushMicrotasks();

    req = httpTestingController.expectOne(
      '/threadhandler/exploration.exp1.ghi3');
    expect(req.request.method).toEqual('GET');
    req.flush({messages: []});

    flushMicrotasks();
  }));

  it('should throw an error if trying to resolve a null thread', async() => {
    await expectAsync(
      threadDataBackendApiService.resolveSuggestionAsync(null))
      .toBeRejectedWithError('Trying to update a non-existent thread');
  });
});
