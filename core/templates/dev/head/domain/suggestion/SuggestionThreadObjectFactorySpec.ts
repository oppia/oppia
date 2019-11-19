// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for SuggestionThreadObjectFactory.
 */

import { UpgradedServices } from 'services/UpgradedServices';

require('domain/suggestion/SuggestionThreadObjectFactory');

describe('Suggestion thread object factory', function() {
  var SuggestionThreadObjectFactory = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function(_SuggestionThreadObjectFactory_) {
    SuggestionThreadObjectFactory = _SuggestionThreadObjectFactory_;
  }));

  it('should create a new suggestion thread from a backend dict.', function() {
    var suggestionThreadBackendDict = {
      last_updated: 1000,
      original_author_username: 'author',
      status: 'accepted',
      subject: 'sample subject',
      summary: 'sample summary',
      message_count: 10,
      state_name: 'state 1',
      thread_id: 'exploration.exp1.thread1',
      thread_summary_dict: {
        status: 'accepted',
        original_author_id: 'usr1',
        last_updated: 1000,
        last_message_text: 'last message',
        total_message_count: 2,
        last_message_is_read: false,
        second_last_message_is_read: true,
        author_last_message: 'Test user 2',
        author_second_last_message: 'Test user 1',
        exploration_title: 'Sample exploration 1',
        exploration_id: 'exploration.exp1',
        thread_id: 'exploration.exp1.thread1',
      },
      suggestion_dict: {
        suggestion_id: 'exploration.exp1.thread1',
        suggestion_type: 'edit_exploration_state_content',
        target_type: 'exploration',
        target_id: 'exp1',
        target_version_at_submission: 1,
        status: 'accepted',
        author_name: 'author',
        change: {
          cmd: 'edit_state_property',
          property_name: 'content',
          state_name: 'state_1',
          new_value: {html: 'new suggestion content'},
          old_value: {html: 'old suggestion content'},
        },
        last_updated: 1000,
      },
    };

    var suggestionThread = SuggestionThreadObjectFactory.createFromBackendDict(
      suggestionThreadBackendDict);
    expect(suggestionThread.status).toEqual('accepted');
    expect(suggestionThread.subject).toEqual('sample subject');
    expect(suggestionThread.summary).toEqual('sample summary');
    expect(suggestionThread.originalAuthorName).toEqual('author');
    expect(suggestionThread.lastUpdated).toEqual(1000);
    expect(suggestionThread.messageCount).toEqual(10);
    expect(suggestionThread.threadId).toEqual('exploration.exp1.thread1');
    expect(suggestionThread.threadSummary.threadId).toEqual(
      'exploration.exp1.thread1');
    expect(suggestionThread.suggestion.suggestionType).toEqual(
      'edit_exploration_state_content');
    expect(suggestionThread.suggestion.targetType).toEqual('exploration');
    expect(suggestionThread.suggestion.targetId).toEqual('exp1');
    expect(suggestionThread.suggestion.suggestionId).toEqual(
      'exploration.exp1.thread1');
    expect(suggestionThread.suggestion.status).toEqual('accepted');
    expect(suggestionThread.suggestion.authorName).toEqual('author');
    expect(suggestionThread.suggestion.newValue.html).toEqual(
      'new suggestion content');
    expect(suggestionThread.suggestion.oldValue.html).toEqual(
      'old suggestion content');
    expect(suggestionThread.suggestion.lastUpdated).toEqual(1000);
    expect(suggestionThread.suggestion.getThreadId()).toEqual(
      'exploration.exp1.thread1');
    expect(suggestionThread.isSuggestionThread()).toEqual(true);
    expect(suggestionThread.isSuggestionHandled()).toEqual(true);
    suggestionThread.suggestion.status = 'review';
    expect(suggestionThread.isSuggestionHandled()).toEqual(false);
    expect(suggestionThread.getSuggestionStatus()).toEqual('review');
    expect(suggestionThread.getSuggestionStateName()).toEqual('state_1');
    expect(suggestionThread.getReplacementHtmlFromSuggestion()).toEqual(
      'new suggestion content');

    var messages = [
      {text: 'message1'},
      {text: 'message2'},
    ];
    suggestionThread.setMessages(messages);
    expect(suggestionThread.messages).toEqual(messages);
  });
});
