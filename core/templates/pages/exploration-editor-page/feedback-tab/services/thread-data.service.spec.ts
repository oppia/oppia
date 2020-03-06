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

// TODO(#7222): Remove the following block of unnnecessary imports once
// thread-data.service.ts is upgraded to Angular 8.
import { FeedbackThread } from
  'domain/feedback_thread/FeedbackThreadObjectFactory';
import { SuggestionObjectFactory } from
  'domain/suggestion/SuggestionObjectFactory';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

import { TranslatorProviderForTests } from 'tests/test.extras';

require(
  'pages/exploration-editor-page/feedback-tab/services/thread-data.service.ts');

describe('retrieving threads service', function() {
  var expId = '12345';
  var ThreadDataService = null;
  var LoggerService = null;
  var AlertsService = null;
  var CsrfService = null;
  var FeedbackThreadObjectFactory = null;
  var $httpBackend = null;
  var $q = null;
  var $rootScope = null;
  var mockFeedbackThreads = null;
  var mockSuggestions = null;
  var mockSuggestionThreads = null;

  beforeEach(angular.mock.module('oppia', TranslatorProviderForTests));
  beforeEach(function() {
    angular.mock.module('oppia');
    angular.mock.module(function($provide) {
      $provide.value('ExplorationDataService', {
        explorationId: expId
      });
      $provide.value('SuggestionObjectFactory', new SuggestionObjectFactory());
    });
  });
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, _$q_, _$rootScope_) {
    ThreadDataService = $injector.get('ThreadDataService');
    AlertsService = $injector.get('AlertsService');
    LoggerService = $injector.get('LoggerService');
    FeedbackThreadObjectFactory = $injector.get('FeedbackThreadObjectFactory');
    $httpBackend = $injector.get('$httpBackend');
    $rootScope = _$rootScope_;
    $q = _$q_;

    CsrfService = $injector.get('CsrfTokenService');
    spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve('sample-csrf-token');
      return deferred.promise;
    });

    mockFeedbackThreads = [
      {
        last_updated: 1441870501230.642,
        original_author_username: 'test_learner',
        state_name: null,
        status: 'open',
        subject: 'Feedback from a learner',
        summary: null,
        thread_id: 'abc1'
      },
      {
        last_updated: 1441870501231.642,
        original_author_username: 'test_learner',
        state_name: null,
        status: 'open',
        subject: 'Feedback from a learner',
        summary: null,
        thread_id: 'abc2'
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
        suggestion_id: 'exp_1.1234',
        suggestion_type: 'edit_exploration_state_content',
        target_id: 'exp_1',
        target_type: 'exploration',
        target_version_at_submission: 1,
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
        thread_id: 'exp_1.1234'
      }
    ];
  }));

  it('should retrieve feedback threads and suggestion thread', function(done) {
    $httpBackend.whenGET('/threadlisthandler/' + expId).respond({
      feedback_thread_dicts: mockFeedbackThreads,
      suggestion_thread_dicts: mockSuggestionThreads
    });
    $httpBackend.whenGET(
      '/suggestionlisthandler?target_type=exploration&target_id=' + expId
    ).respond({ suggestions: mockSuggestions });

    ThreadDataService.fetchThreads().then(threadData => {
      for (let feedbackThread of mockFeedbackThreads) {
        expect(threadData.feedbackThreads).toContain(jasmine.objectContaining(
          { threadId: feedbackThread.thread_id }));
      }

      for (let suggestionThread of mockSuggestionThreads) {
        expect(threadData.suggestionThreads).toContain(jasmine.objectContaining(
          { threadId: suggestionThread.thread_id }));
      }
    }).then(done, done.fail);
    $httpBackend.flush();
  });

  it('should retrieve only feedback threads', function() {
    var loggerErrorSpy = spyOn(LoggerService, 'error').and.callThrough();
    $httpBackend.whenGET('/threadlisthandler/' + expId).respond({
      feedback_thread_dicts: mockFeedbackThreads,
      suggestion_thread_dicts: mockSuggestionThreads
    });
    $httpBackend.whenGET(
      '/suggestionlisthandler?target_type=exploration&target_id=' + expId
    ).respond({ suggestions: [] });

    ThreadDataService.fetchThreads().then(function(threadData) {
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Number of suggestion threads doesn\'t match number of' +
        'suggestion objects');

      for (let feedbackThread of mockFeedbackThreads) {
        expect(threadData.feedbackThreads).toContain(jasmine.objectContaining(
          { threadId: feedbackThread.thread_id }));
      }

      expect(threadData.suggestionThreads).toEqual([]);
    });
    $httpBackend.flush();
  });

  it('should use reject handler whenever fetching feedback threads or' +
    ' suggestion threads fails', function(done) {
    var loggerErrorSpy = spyOn(LoggerService, 'error').and.callThrough();
    $httpBackend.whenGET('/threadlisthandler/' + expId).respond(
      500, 'Error on retriving feedback threads.');
    $httpBackend.whenGET(
      '/suggestionlisthandler?target_type=exploration&target_id=' + expId
    ).respond({ suggestions: mockSuggestions });

    ThreadDataService.fetchThreads().then(done, function() {
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Error on retriving feedback threads.');
      done();
    });
    $httpBackend.flush();
  });

  it('should successfully fetch a message from a thread', function(done) {
    var mockThread = mockFeedbackThreads[0];
    var thread = new FeedbackThread(
      mockThread.status, mockThread.subject, mockThread.summary,
      mockThread.originalAuthorName, mockThread.lastUpdated,
      mockThread.messageCount, mockThread.stateName, mockThread.threadId
    );
    var messages = [
      'Message 1',
      'Message 2'
    ];

    spyOn(FeedbackThreadObjectFactory, 'createFromBackendDict')
      .and.returnValue(thread);

    $httpBackend.whenGET('/threadlisthandler/' + expId).respond({
      feedback_thread_dicts: [mockThread],
      suggestion_thread_dicts: []
    });
    $httpBackend.whenGET(
      '/suggestionlisthandler?target_type=exploration&target_id=' + expId)
      .respond({ suggestions: [] });
    ThreadDataService.fetchThreads().then(done, done.fail);
    $httpBackend.flush();

    var setMessagesSpy = spyOn(thread, 'setMessages').and.callThrough();
    $httpBackend.expect('GET', '/threadhandler/' + thread.threadId).respond({
      data: { messages }
    });
    ThreadDataService.fetchMessages(thread.threadId).then(function() {
      expect(setMessagesSpy).toHaveBeenCalled();
    }, done.fail);
    $httpBackend.flush();
  });

  it('should use reject handler when fetching a message from a thread fails',
    function(done) {
      var loggerErrorSpy = spyOn(LoggerService, 'error').and.callThrough();
      var mockThread = mockFeedbackThreads[0];
      var thread = new FeedbackThread(
        mockThread.status, mockThread.subject, mockThread.summary,
        mockThread.originalAuthorName, mockThread.lastUpdated,
        mockThread.messageCount, mockThread.stateName, mockThread.threadId
      );

      spyOn(FeedbackThreadObjectFactory, 'createFromBackendDict')
        .and.returnValue(thread);
      var setMessagesSpy = spyOn(thread, 'setMessages').and.callThrough();

      $httpBackend.expect('GET', '/threadhandler/' + thread.threadId).respond(
        500, 'Error on fetching messages from a thread.');
      ThreadDataService.fetchMessages(thread.threadId).then(
        done, function() {
          expect(setMessagesSpy).not.toHaveBeenCalled();
          expect(loggerErrorSpy).toHaveBeenCalledWith(
            'Error on fetching messages from a thread.');
          done();
        }
      );
      $httpBackend.flush();
    });

  it('should successfully fetch feedback stats', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect('GET', '/feedbackstatshandler/' + expId).respond({
      num_open_threads: 10
    });
    ThreadDataService.fetchFeedbackStats().then(successHandler, failHandler);
    $httpBackend.flush();

    expect(ThreadDataService.getOpenThreadsCount()).toBe(10);
    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should use reject handler when fetching feedback stats fails',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      $httpBackend.expect('GET', '/feedbackstatshandler/' + expId).respond(500,
        'Error on fetch feedback stats');
      ThreadDataService.fetchFeedbackStats().then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(ThreadDataService.getOpenThreadsCount()).toBe(0);
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    });

  it('should successfully create a new thread', function() {
    var successCallback = jasmine.createSpy('success');
    var subject = 'New Subject';
    var mockCreatedFeedbackThread = [{
      last_updated: 1441870501230.642,
      original_author_username: 'test_learner',
      state_name: null,
      status: 'open',
      subject: subject,
      summary: null,
    }];

    expect(ThreadDataService.getOpenThreadsCount()).toBe(0);

    $httpBackend.whenGET(
      '/suggestionlisthandler?target_type=exploration&target_id=' + expId
    ).respond({ suggestions: mockSuggestions });
    $httpBackend.expectPOST('/threadlisthandler/' + expId).respond(200);
    $httpBackend.whenGET('/threadlisthandler/' + expId).respond({
      feedback_thread_dicts: mockCreatedFeedbackThread,
      suggestion_thread_dicts: mockSuggestionThreads
    });
    ThreadDataService.createNewThread(subject, 'Text', successCallback)
      .then(function(threadData) {
        expect(threadData.feedbackThreads[0].subject).toBe(subject);

        expect(ThreadDataService.getOpenThreadsCount()).toBe(1);
        expect(successCallback).toHaveBeenCalled();
      });
    $httpBackend.flush(3);
  });

  it('should use reject handler when creating a new thread fails', function() {
    var successCallback = jasmine.createSpy('success');
    var alertsWarningSpy = spyOn(AlertsService, 'addWarning').and.callThrough();

    expect(ThreadDataService.getOpenThreadsCount()).toBe(0);

    $httpBackend.expectPOST('/threadlisthandler/' + expId).respond(500);
    ThreadDataService.createNewThread('Subject', 'Text', successCallback);
    $httpBackend.flush();

    expect(ThreadDataService.getOpenThreadsCount()).toBe(0);
    expect(alertsWarningSpy).toHaveBeenCalledWith(
      'Error creating new thread.');
    expect(successCallback).toHaveBeenCalled();
  });

  it('should successfully mark thread as seen', function(done) {
    var threadId = 'abc1';
    $httpBackend.expectPOST('/feedbackhandler/thread_view_event/' + threadId)
      .respond(200);
    ThreadDataService.markThreadAsSeen(threadId).then(done, done.fail);
    $httpBackend.flush();
  });

  it('should use reject handler when marking thread as seen fails',
    function(done) {
      var threadId = 'abc1';
      $httpBackend.expectPOST(
        '/feedbackhandler/thread_view_event/' + threadId).respond(500);
      ThreadDataService.markThreadAsSeen(threadId).then(done, function(error) {
        expect(error.status).toBe(500);
        done();
      });
      $httpBackend.flush();
    });

  it('should use reject handler when adding a new message to a nonexistent' +
    ' thread', function(done) {
    var invalidThreadId = '0';
    var successCallback = jasmine.createSpy('success');
    var failureCallback = jasmine.createSpy('failure');
    ThreadDataService.addNewMessage(
      invalidThreadId, 'Message', 'open', successCallback, failureCallback)
      .then(done,
        function(error) {
          expect(error).toBe(
            'Can not add message to nonexistent thread.');
          expect(successCallback).not.toHaveBeenCalled();
          expect(failureCallback).not.toHaveBeenCalled();
          done();
        });
    $rootScope.$digest();
  });

  it('should successfully add a new message in a thread when its status' +
    ' is different than old status and its status is close', function(done) {
    var threadId = 'abc1';
    var successCallback = jasmine.createSpy('successCallback');
    var failureCallback = jasmine.createSpy('failureCallback');

    // Fetch a thread
    $httpBackend.whenGET('/threadlisthandler/' + expId).respond({
      feedback_thread_dicts: mockFeedbackThreads,
      suggestion_thread_dicts: mockSuggestionThreads
    });
    $httpBackend.whenGET(
      '/suggestionlisthandler?target_type=exploration&target_id=' + expId
    ).respond({ suggestions: mockSuggestions });
    ThreadDataService.fetchThreads().then(done, done.fail);
    $httpBackend.flush();

    // Fetch feedback stats
    $httpBackend.expect('GET', '/feedbackstatshandler/' + expId).respond({
      num_open_threads: 1
    });
    ThreadDataService.fetchFeedbackStats();
    $httpBackend.flush();
    expect(ThreadDataService.getOpenThreadsCount()).toBe(1);

    // Post message
    $httpBackend.expectPOST('/threadhandler/' + 'abc1').respond(200, {});
    // Fetch message
    $httpBackend.expect('GET', '/threadhandler/' + threadId).respond({});
    ThreadDataService.addNewMessage(
      threadId, 'Message', 'close', successCallback, failureCallback).then(
      done);
    $httpBackend.flush(2);

    expect(ThreadDataService.getOpenThreadsCount()).toBe(0);
    expect(successCallback).toHaveBeenCalled();
    expect(failureCallback).not.toHaveBeenCalled();
  });

  it('should successfully add a new message in a thread when its status' +
    ' is different of old status and its status is open', function(done) {
    var threadId = 'abc1';
    var successCallback = jasmine.createSpy('successCallback');
    var failureCallback = jasmine.createSpy('failureCallback');

    mockFeedbackThreads[0].status = 'close';

    // Fetch a thread
    $httpBackend.whenGET('/threadlisthandler/' + expId)
      .respond({
        feedback_thread_dicts: mockFeedbackThreads,
        suggestion_thread_dicts: mockSuggestionThreads
      });
    $httpBackend.whenGET(
      '/suggestionlisthandler?target_type=exploration&target_id=' + expId
    ).respond({ suggestions: mockSuggestions });
    ThreadDataService.fetchThreads().then(done, done.fail);
    $httpBackend.flush();

    // Fetch feedback stats
    $httpBackend.expect('GET', '/feedbackstatshandler/' + expId).respond({
      num_open_threads: 1
    });
    ThreadDataService.fetchFeedbackStats();
    $httpBackend.flush();
    expect(ThreadDataService.getOpenThreadsCount()).toBe(1);

    // Post message
    $httpBackend.expectPOST('/threadhandler/' + 'abc1').respond(200, {});
    // Fetch message
    $httpBackend.expect('GET', '/threadhandler/' + threadId).respond({});
    ThreadDataService.addNewMessage(
      threadId, 'Message', 'open', successCallback, failureCallback).then(
      done);
    $httpBackend.flush(2);

    expect(ThreadDataService.getOpenThreadsCount()).toBe(2);
    expect(successCallback).toHaveBeenCalled();
    expect(failureCallback).not.toHaveBeenCalled();
  });

  it('should successfully add a new message in a thread when its status' +
    ' is equal old status', function(done) {
    var threadId = 'abc1';
    var successCallback = jasmine.createSpy('successCallback');
    var failureCallback = jasmine.createSpy('failureCallback');

    // Fetch a thread
    $httpBackend.whenGET('/threadlisthandler/' + expId).respond({
      feedback_thread_dicts: mockFeedbackThreads,
      suggestion_thread_dicts: mockSuggestionThreads
    });
    $httpBackend.whenGET(
      '/suggestionlisthandler?target_type=exploration&target_id=' + expId
    ).respond({ suggestions: mockSuggestions });
    ThreadDataService.fetchThreads().then(done, done.fail);
    $httpBackend.flush();

    // Fetch feedback stats
    $httpBackend.expect('GET', '/feedbackstatshandler/' + expId).respond({
      num_open_threads: 1
    });
    ThreadDataService.fetchFeedbackStats();
    $httpBackend.flush();
    expect(ThreadDataService.getOpenThreadsCount()).toBe(1);

    // Post message
    $httpBackend.expectPOST('/threadhandler/' + 'abc1').respond(200, {});
    // Fetch message
    $httpBackend.expect('GET', '/threadhandler/' + threadId).respond({});
    ThreadDataService.addNewMessage(
      threadId, 'Message', 'open', successCallback, failureCallback).then(
      done);
    $httpBackend.flush(2);

    expect(ThreadDataService.getOpenThreadsCount()).toBe(1);
    expect(successCallback).toHaveBeenCalled();
    expect(failureCallback).not.toHaveBeenCalled();
  });

  it('should use reject handler when resolving a suggestion to a nonexistent' +
    ' thread', function(done) {
    var invalidThreadId = '0';
    var successCallback = jasmine.createSpy('success');
    var failureCallback = jasmine.createSpy('failure');
    ThreadDataService.resolveSuggestion(
      invalidThreadId, 'accept', 'Commit', 'Review', successCallback,
      failureCallback)
      .then(done,
        function(error) {
          expect(error).toBe(
            'Can not resolve a suggestion to nonexistent thread.');
          expect(successCallback).not.toHaveBeenCalled();
          expect(failureCallback).not.toHaveBeenCalled();
          done();
        });
    $rootScope.$digest();
  });

  it('should successfully resolve a suggestion', function(done) {
    var successCallback = jasmine.createSpy('successCallback');
    var failureCallback = jasmine.createSpy('failureCallback');

    $httpBackend.whenGET('/threadlisthandler/' + expId).respond({
      feedback_thread_dicts: mockFeedbackThreads,
      suggestion_thread_dicts: mockSuggestionThreads
    });
    $httpBackend.whenGET(
      '/suggestionlisthandler?target_type=exploration&target_id=' + expId
    ).respond({ suggestions: mockSuggestions });
    ThreadDataService.fetchThreads().then(done, done.fail);
    $httpBackend.flush();

    $httpBackend.expect('GET', '/feedbackstatshandler/' + expId).respond({
      num_open_threads: 1
    });
    ThreadDataService.fetchFeedbackStats();
    $httpBackend.flush();
    expect(ThreadDataService.getOpenThreadsCount()).toBe(1);

    $httpBackend.expectPUT(
      '/suggestionactionhandler/exploration/' + expId + '/' + 'abc1')
      .respond(200, {});
    ThreadDataService.resolveSuggestion(
      'abc1', 'Message', 'status', 'a', true, successCallback, failureCallback)
      .then(successCallback, failureCallback);
    $httpBackend.flush();

    expect(ThreadDataService.getOpenThreadsCount()).toBe(0);
    expect(successCallback).toHaveBeenCalled();
    expect(failureCallback).not.toHaveBeenCalled();
  });
});
