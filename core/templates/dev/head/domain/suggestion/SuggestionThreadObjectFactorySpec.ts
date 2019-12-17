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

// TODO(#7222): Remove the following block of unnnecessary imports once
// SuggestionThreadObjectFactory.ts is upgraded to Angular 8.
import { SuggestionObjectFactory } from
  'domain/suggestion/SuggestionObjectFactory';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('domain/suggestion/SuggestionThreadObjectFactory.ts');

describe('Suggestion thread object factory', function() {
  beforeEach(function() {
    angular.mock.module('oppia');
  });
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('SuggestionObjectFactory', new SuggestionObjectFactory());
  }));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  var SuggestionThreadObjectFactory = null;
  var suggestionObjectFactory = null;

  beforeEach(angular.mock.inject(function($injector) {
    SuggestionThreadObjectFactory = $injector.get(
      'SuggestionThreadObjectFactory');
    suggestionObjectFactory = $injector.get('SuggestionObjectFactory');
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
      thread_id: 'exploration.exp1.thread1'
    };

    var suggestionBackendDict = {
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
        new_value: {
          html: 'new suggestion content'
        },
        old_value: {
          html: 'old suggestion content'
        }
      },
      last_updated: 1000
    };
    var suggestionThread = SuggestionThreadObjectFactory.createFromBackendDicts(
      suggestionThreadBackendDict, suggestionBackendDict);
    expect(suggestionThread.status).toEqual('accepted');
    expect(suggestionThread.subject).toEqual('sample subject');
    expect(suggestionThread.summary).toEqual('sample summary');
    expect(suggestionThread.originalAuthorName).toEqual('author');
    expect(suggestionThread.lastUpdated).toEqual(1000);
    expect(suggestionThread.messageCount).toEqual(10);
    expect(suggestionThread.threadId).toEqual('exploration.exp1.thread1');
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

    var messages = [{
      text: 'message1'
    }, {
      text: 'message2'
    }];
    suggestionThread.setMessages(messages);
    expect(suggestionThread.messages).toEqual(messages);
  });
});
