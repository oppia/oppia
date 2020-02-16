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
import { UpgradedServices } from 'services/UpgradedServices';

require(
  'pages/exploration-editor-page/feedback-tab/services/thread-data.service.ts');

describe('retrieving threads service', function() {
  beforeEach(() => {
    this.expId = 'exp1';
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function(
      _$httpBackend_, _ExplorationDataService_, _ThreadDataService_) {
    this.$httpBackend = _$httpBackend_;
    this.ExplorationDataService = _ExplorationDataService_;
    this.ThreadDataService = _ThreadDataService_;

    spyOn(this.ExplorationDataService, 'getExplorationId')
      .and.returnValue(this.expId);
  }));

  it('should retrieve feedback threads', function(done) {
    var mockFeedbackThreads = [
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
    var mockSuggestionThreads = [
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
    var mockSuggestions = [
      {
        assigned_reviewer_id: null,
        author_name: 'author_1',
        change: {
          new_value: { html: 'new content html', audio_translation: {} },
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
        target_version_at_submission: 1
      }
    ];

    this.$httpBackend.whenGET('/threadlisthandler/' + this.expId).respond({
      feedback_thread_dicts: mockFeedbackThreads,
      suggestion_thread_dicts: mockSuggestionThreads
    });
    this.$httpBackend.whenGET(
      '/suggestionlisthandler?target_type=exploration&target_id=' + this.expId)
      .respond({ suggestions: mockSuggestions });

    this.ThreadDataService.fetchThreads().then(threadData => {
      expect(threadData.feedbackThreads.map(t => t.threadId))
        .toEqual(['exploration.exp1.abc1', 'exploration.exp1.def2']);
      expect(threadData.suggestionThreads.map(t => t.threadId))
        .toEqual(['exploration.exp1.ghi3']);
    }).then(done, done.fail);
    this.$httpBackend.flush();
  });
});
