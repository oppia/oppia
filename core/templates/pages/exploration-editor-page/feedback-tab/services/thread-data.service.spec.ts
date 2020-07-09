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
 * @fileoverview Unit tests for ThreadDataService, which retrieves thread
 * data for the feedback tab of the exploration editor.
 */

// TODO(#7222): Remove the following block of unnecessary imports once
// thread-data.service.ts is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';



require('domain/feedback_thread/FeedbackThreadObjectFactory.ts');
require('domain/suggestion/SuggestionThreadObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-editor-page/exploration-editor-page.constants.ts');
require(
  'pages/exploration-editor-page/feedback-tab/services/thread-data.service.ts');
require('pages/exploration-editor-page/services/exploration-data.service.ts');
require('services/alerts.service.ts');
require('services/suggestions.service.ts');

describe('retrieving threads service', () => {
  let $httpBackend = null;
  let $q = null;
  let $rootScope = null;
  let ContextService = null;
  let CsrfTokenService = null;
  let FeedbackThreadObjectFactory = null;
  let SuggestionThreadObjectFactory = null;
  let ThreadDataService = null;

  beforeEach(() => {
    this.expId = 'exp1';
    this.mockFeedbackThreads = [
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
    this.mockSuggestionThreads = [
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
    this.mockSuggestions = [
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
    this.mockMessages = [
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

  beforeEach(angular.mock.module('oppia', $provide => {
    let ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject($injector => {
    $httpBackend = $injector.get('$httpBackend');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    ContextService = $injector.get('ContextService');
    CsrfTokenService = $injector.get('CsrfTokenService');
    FeedbackThreadObjectFactory = $injector.get('FeedbackThreadObjectFactory');
    SuggestionThreadObjectFactory =
      $injector.get('SuggestionThreadObjectFactory');
    ThreadDataService = $injector.get('ThreadDataService');

    spyOn(ContextService, 'getExplorationId').and.returnValue('exp1');
    spyOn(CsrfTokenService, 'getTokenAsync')
      .and.returnValue($q.resolve('sample-csrf-token'));
  }));

  it('should retrieve feedback threads and suggestion thread', done => {
    $httpBackend.whenGET('/threadlisthandler/exp1').respond({
      feedback_thread_dicts: this.mockFeedbackThreads,
      suggestion_thread_dicts: this.mockSuggestionThreads
    });
    $httpBackend.whenGET(
      '/suggestionlisthandler?target_type=exploration&target_id=exp1')
      .respond({ suggestions: this.mockSuggestions });

    ThreadDataService.getThreadsAsync().then(
      threadData => {
        for (let mockFeedbackThread of this.mockFeedbackThreads) {
          expect(ThreadDataService.getThread(mockFeedbackThread.thread_id))
            .not.toBeNull();
        }
        for (let mockSuggestionThread of this.mockSuggestionThreads) {
          expect(ThreadDataService.getThread(mockSuggestionThread.thread_id))
            .not.toBeNull();
        }
        done();
      },
      done.fail);
    $httpBackend.flush();
  });

  it('should call reject handler if any thread is null', done => {
    $httpBackend.whenGET('/threadlisthandler/exp1').respond({
      feedback_thread_dicts: [null],
      suggestion_thread_dicts: []
    });
    $httpBackend.whenGET(
      '/suggestionlisthandler?target_type=exploration&target_id=exp1')
      .respond({ suggestions: [] });

    ThreadDataService.getThreadsAsync().then(
      done.fail,
      error => {
        expect(error).toMatch('Missing input backend dict');
        done();
      });
    $httpBackend.flush(2);

    $httpBackend.whenGET('/threadlisthandler/exp1').respond({
      feedback_thread_dicts: [],
      suggestion_thread_dicts: [null]
    });
    $httpBackend.whenGET(
      '/suggestionlisthandler?target_type=exploration&target_id=exp1')
      .respond({ suggestions: this.mockSuggestions });

    ThreadDataService.getThreadsAsync().then(
      done.fail,
      error => {
        expect(error).toMatch('Missing input backend dict');
        done();
      });
    $httpBackend.flush(2);
  });

  it('should call reject handler if suggestions are missing', done => {
    $httpBackend.whenGET('/threadlisthandler/exp1').respond({
      feedback_thread_dicts: [],
      suggestion_thread_dicts: this.mockSuggestionThreads
    });
    $httpBackend.whenGET(
      '/suggestionlisthandler?target_type=exploration&target_id=exp1')
      .respond({ suggestions: [] });

    ThreadDataService.getThreadsAsync().then(
      done.fail,
      error => {
        expect(error).toMatch('Missing input backend dict');
        done();
      });
    $httpBackend.flush();
  });

  it(
    'should use reject handler whenever fetching feedback threads or ' +
    'suggestion threads fails', done => {
      $httpBackend.whenGET('/threadlisthandler/exp1')
        .respond(500, 'Error on retrieving feedback threads.');
      $httpBackend.whenGET(
        '/suggestionlisthandler?target_type=exploration&target_id=exp1')
        .respond({ suggestions: this.mockSuggestions });

      ThreadDataService.getThreadsAsync().then(
        done.fail,
        error => {
          expect(error).toEqual('Error on retrieving feedback threads.');
          done();
        });
      $httpBackend.flush();
    });

  it('should successfully fetch the messages of a thread', done => {
    let mockThread = this.mockFeedbackThreads[0];
    let thread = FeedbackThreadObjectFactory.createFromBackendDict(mockThread);

    $httpBackend.expectGET('/threadhandler/exploration.exp1.abc1').respond({
      messages: this.mockMessages
    });
    let setMessagesSpy = spyOn(thread, 'setMessages').and.callThrough();

    ThreadDataService.getMessagesAsync(thread).then(
      () => {
        expect(setMessagesSpy).toHaveBeenCalled();
        expect(thread.lastNonemptyMessageSummary.text).toEqual('2nd message');
        done();
      },
      done.fail);
    $httpBackend.flush();
  });

  it('should throw error if trying to fetch messages of null thread', () => {
    expect(() => ThreadDataService.getMessagesAsync(null))
      .toThrowError('Trying to update a non-existent thread');
  });

  it('should call reject handler when fetching messages fails', done => {
    let mockThread = this.mockFeedbackThreads[0];
    let thread = FeedbackThreadObjectFactory.createFromBackendDict(mockThread);

    let setMessagesSpy = spyOn(thread, 'setMessages').and.callThrough();

    $httpBackend.expectGET('/threadhandler/exploration.exp1.abc1')
      .respond(500, 'Error on fetching messages from a thread.');
    ThreadDataService.getMessagesAsync(thread).then(
      done.fail,
      error => {
        expect(error.data).toEqual('Error on fetching messages from a thread.');
        expect(error.status).toEqual(500);
        expect(setMessagesSpy).not.toHaveBeenCalled();
        done();
      });
    $httpBackend.flush();
  });

  it('should successfully fetch feedback stats', done => {
    $httpBackend.expectGET('/feedbackstatshandler/exp1').respond({
      num_open_threads: 10
    });
    ThreadDataService.getOpenThreadsCountAsync().then(
      () => {
        expect(ThreadDataService.getOpenThreadsCount()).toEqual(10);
        done();
      },
      done.fail);
    $httpBackend.flush();
  });

  it('should use reject handler when fetching feedback stats fails', done => {
    $httpBackend.expectGET('/feedbackstatshandler/exp1')
      .respond(500, 'Error on fetch feedback stats');
    ThreadDataService.getOpenThreadsCountAsync().then(
      done.fail,
      () => {
        expect(ThreadDataService.getOpenThreadsCount()).toEqual(0);
        done();
      });
    $httpBackend.flush();
  });

  it('should successfully create a new thread', done => {
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

    $httpBackend.expectPOST('/threadlisthandler/exp1').respond(200);
    $httpBackend.whenGET('/threadlisthandler/exp1').respond({
      feedback_thread_dicts: [mockCreatedFeedbackThread],
      suggestion_thread_dicts: []
    });
    $httpBackend.whenGET(
      '/suggestionlisthandler?target_type=exploration&target_id=exp1')
      .respond({ suggestions: [] });

    expect(ThreadDataService.getOpenThreadsCount()).toEqual(0);
    ThreadDataService.createNewThreadAsync(subject, 'Text').then(
      threadData => {
        expect(threadData.feedbackThreads.length).toEqual(1);
        expect(threadData.feedbackThreads[0].threadId)
          .toEqual('exploration.exp1.jkl1');
        expect(ThreadDataService.getOpenThreadsCount()).toEqual(1);
        done();
      },
      done.fail);
    $httpBackend.flush(3);
  });

  it('should use reject handler when creating a new thread fails', () => {
    expect(ThreadDataService.getOpenThreadsCount()).toEqual(0);
    $httpBackend.expectPOST('/threadlisthandler/exp1').respond(500);
    ThreadDataService.createNewThreadAsync('Subject', 'Text');
    $httpBackend.flush();
    expect(ThreadDataService.getOpenThreadsCount()).toEqual(0);
  });

  it('should successfully mark thread as seen', done => {
    let mockThread = this.mockFeedbackThreads[0];
    let thread = FeedbackThreadObjectFactory.createFromBackendDict(mockThread);
    $httpBackend.expectPOST(
      '/feedbackhandler/thread_view_event/exploration.exp1.abc1').respond(200);
    ThreadDataService.markThreadAsSeenAsync(thread).then(done, done.fail);
    $httpBackend.flush();
  });

  it('should throw error if trying to mark null thread as seen', () => {
    expect(() => ThreadDataService.markThreadAsSeenAsync(null))
      .toThrowError('Trying to update a non-existent thread');
  });

  it('should use reject handler when marking thread as seen fails', done => {
    let mockThread = this.mockFeedbackThreads[0];
    let thread = FeedbackThreadObjectFactory.createFromBackendDict(mockThread);
    $httpBackend.expectPOST(
      '/feedbackhandler/thread_view_event/exploration.exp1.abc1').respond(500);
    ThreadDataService.markThreadAsSeenAsync(thread).then(
      done.fail,
      error => {
        expect(error.status).toEqual(500);
        done();
      });
    $httpBackend.flush();
  });

  it('should use reject handler when passing a null thread', () => {
    expect(() => ThreadDataService.addNewMessageAsync(null, 'Message', 'open'))
      .toThrowError('Trying to update a non-existent thread');
  });

  it(
    'should successfully add a new message in a thread when its status ' +
    'is different than old status and its status is close', done => {
      let mockThread = this.mockFeedbackThreads[0];
      let thread = FeedbackThreadObjectFactory.createFromBackendDict(
        mockThread);

      // Fetch feedback stats.
      $httpBackend.expectGET('/feedbackstatshandler/exp1').respond({
        num_open_threads: 1
      });
      ThreadDataService.getOpenThreadsCountAsync();
      $httpBackend.flush();
      expect(ThreadDataService.getOpenThreadsCount()).toEqual(1);

      $httpBackend.expectPOST('/threadhandler/exploration.exp1.abc1')
        .respond(200);
      $httpBackend.expectGET('/threadhandler/exploration.exp1.abc1').respond({
        messages: []
      });

      ThreadDataService.addNewMessageAsync(thread, 'Message', 'close').then(
        () => {
          expect(ThreadDataService.getOpenThreadsCount()).toEqual(0);
          done();
        },
        done.fail);
      $httpBackend.flush(2);
    });

  it(
    'should successfully add a new message in a thread when its status ' +
    'is different of old status and its status is open', done => {
      let mockThread = this.mockFeedbackThreads[0];
      mockThread.status = 'close';
      let thread = FeedbackThreadObjectFactory.createFromBackendDict(
        mockThread);

      // Fetch feedback stats.
      $httpBackend.expectGET('/feedbackstatshandler/exp1').respond({
        num_open_threads: 1
      });
      ThreadDataService.getOpenThreadsCountAsync();
      $httpBackend.flush();
      expect(ThreadDataService.getOpenThreadsCount()).toEqual(1);

      $httpBackend.expectPOST('/threadhandler/exploration.exp1.abc1')
        .respond(200);
      $httpBackend.expectGET('/threadhandler/exploration.exp1.abc1').respond({
        messages: []
      });
      ThreadDataService.addNewMessageAsync(thread, 'Message', 'open').then(
        () => {
          expect(ThreadDataService.getOpenThreadsCount()).toEqual(2);
          done();
        },
        done.fail);
      $httpBackend.flush(2);
    });

  it(
    'should successfully add a new message in a thread when its status ' +
    'is equal old status', done => {
      let mockThread = this.mockFeedbackThreads[0];
      let thread = FeedbackThreadObjectFactory.createFromBackendDict(
        mockThread);

      // Fetch feedback stats.
      $httpBackend.expectGET('/feedbackstatshandler/exp1').respond({
        num_open_threads: 1
      });
      ThreadDataService.getOpenThreadsCountAsync();
      $httpBackend.flush();
      expect(ThreadDataService.getOpenThreadsCount()).toEqual(1);

      $httpBackend.expectPOST('/threadhandler/exploration.exp1.abc1')
        .respond(200);
      $httpBackend.expectGET('/threadhandler/exploration.exp1.abc1').respond({
        messages: []
      });
      ThreadDataService.addNewMessageAsync(thread, 'Message', 'open').then(
        () => {
          expect(ThreadDataService.getOpenThreadsCount()).toEqual(1);
          done();
        },
        done.fail);
      $httpBackend.flush(2);
    });

  it('should successfully resolve a suggestion', done => {
    let thread = SuggestionThreadObjectFactory.createFromBackendDicts(
      this.mockSuggestionThreads[0], this.mockSuggestions[0]);

    $httpBackend.whenGET('/threadlisthandler/exp1').respond({
      feedback_thread_dicts: [],
      suggestion_thread_dicts: this.mockSuggestionThreads
    });
    $httpBackend.whenGET(
      '/suggestionlisthandler?target_type=exploration&target_id=exp1')
      .respond({ suggestions: this.mockSuggestions });
    ThreadDataService.getThreadsAsync();
    $httpBackend.flush();

    $httpBackend.expectGET('/feedbackstatshandler/exp1').respond({
      num_open_threads: 1
    });
    ThreadDataService.getOpenThreadsCountAsync();
    $httpBackend.flush();
    expect(ThreadDataService.getOpenThreadsCount()).toEqual(1);

    $httpBackend.expectPUT(
      '/suggestionactionhandler/exploration/exp1/exploration.exp1.ghi3')
      .respond(200);
    $httpBackend.expectGET('/threadhandler/exploration.exp1.ghi3').respond({
      messages: []
    });
    ThreadDataService.resolveSuggestionAsync(
      thread, 'Message', 'status', 'a', true)
      .then(
        () => {
          expect(ThreadDataService.getOpenThreadsCount()).toEqual(0);
          done();
        },
        done.fail);
    $httpBackend.flush();
  });

  it('should throw an error if trying to resolve a null thread', () => {
    expect(() => ThreadDataService.resolveSuggestionAsync(null))
      .toThrowError('Trying to update a non-existent thread');
  });
});
