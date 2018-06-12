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

describe('retrieving threads service', function() {
  var expId = '12345';
  beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));
  beforeEach(function() {
    module('oppia');
    module(function($provide) {
      $provide.value('ExplorationDataService', {
        explorationId: expId
      });
    });
  });

  var ThreadDataService, httpBackend;
  beforeEach(inject(function($httpBackend, _ThreadDataService_) {
    ThreadDataService = _ThreadDataService_;
    httpBackend = $httpBackend;
  }));

  it('should retrieve feedback threads', function() {
    var mockFeedbackThreads = [
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

    var mockOpenSuggestionThreads = [
      {
        last_updated: 1441870501232.642,
        original_author_username: 'test_learner',
        state_name: null,
        status: 'open',
        subject: 'Suggestion from a learner',
        summary: null,
        thread_id: 'abc3'
      },
      {
        last_updated: 1441870501233.642,
        original_author_username: 'test_learner',
        state_name: null,
        status: 'open',
        subject: 'Suggestion from a learner',
        summary: null,
        thread_id: 'abc4'
      }
    ];

    var mockGeneralSuggestionThreads = [
      {
        assigned_reviewer_id: null,
        author_name: 'author_1',
        change_cmd: {
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
        suggestion_id: 'exploration.exp_1.1234',
        suggestion_type: 'edit_exploration_state_content',
        target_id: 'exp_1',
        target_type: 'exploration',
        target_version_at_submission: 1
      }
    ]

    httpBackend.whenGET('/threadlisthandler/' + expId).respond({
      threads: mockFeedbackThreads
    });

    if (constants.USE_NEW_SUGGESTION_FRAMEWORK) {
      httpBackend.whenGET(
        '/suggestionlisthandler/?list_type=target&target_type=exploration&' +
        'target_id=' + expId).respond({
        threads: mockGeneralSuggestionThreads
      });
    } else {
       httpBackend.whenGET(
        '/suggestionlisthandler/' + expId + '?has_suggestion=true&list_type=all'
      ).respond({
        threads: mockOpenSuggestionThreads
      });
    }
    ThreadDataService.fetchThreads();
    httpBackend.flush();

    for (var i = 0; i < mockFeedbackThreads.length; i++) {
      expect(ThreadDataService.data.feedbackThreads).toContain(
        mockFeedbackThreads[i]);
    }
    if (constants.USE_NEW_SUGGESTION_FRAMEWORK) {
      for (var i = 0; i < mockGeneralSuggestionThreads.length; i++) {
        expect(ThreadDataService.data.suggestionThreads).toContain(
          mockGeneralSuggestionThreads[i]);
      }
    } else {
      for (var i = 0; i < mockOpenSuggestionThreads.length; i++) {
        expect(ThreadDataService.data.suggestionThreads).toContain(
          mockOpenSuggestionThreads[i]);
      }
    }
  });
});
