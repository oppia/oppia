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

describe('Suggestion thread object factory', function() {
  beforeEach(module('oppia'));
  var SuggestionThreadObjectFactory = null;
  var SuggestionObjectFactory = null;

  beforeEach(inject(function($injector) {
    SuggestionThreadObjectFactory = $injector.get(
      'SuggestionThreadObjectFactory');
    SuggestionObjectFactory = $injector.get('SuggestionObjectFactory');
  }));

  it('should create a new suggestion thread from a backend dict.', function(){
    suggestionThreadBackendDict = {
      last_updated: 1000,
      original_author_username: 'author',
      status: 'accepted',
      subject: 'sample subject',
      summary: 'sample summary',
      message_count: 10,
      state_name: 'state 1',
      thread_id: 'exp1.thread1'
    };

    suggestionBackendDict = {
      suggestion_id: 'exploration.exp1.thread1',
      suggestion_type: 'edit_exploration_state_content',
      target_type: 'exploration',
      target_id: 'exp1',
      target_version_at_submission: 1,
      status: 'accepted',
      author_name: 'author',
      change_cmd: {
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
    suggestionThread = SuggestionThreadObjectFactory.createFromBackendDicts(
      suggestionThreadBackendDict, suggestionBackendDict);
    expect(suggestionThread.status).toEqual('accepted');
    expect(suggestionThread.subject).toEqual('sample subject');
    expect(suggestionThread.summary).toEqual('sample summary');
    expect(suggestionThread.originalAuthorName).toEqual('author');
    expect(suggestionThread.lastUpdated).toEqual(1000);
    expect(suggestionThread.messageCount).toEqual(10);
    expect(suggestionThread.threadId).toEqual('exp1.thread1');
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
    expect(suggestionThread.suggestion.threadId()).toEqual('exp1.thread1');
    expect(suggestionThread.isSuggestionThread()).toEqual(true);
    expect(suggestionThread.isSuggestionHandled()).toEqual(true);
    suggestionThread.suggestion.status = 'review';
    expect(suggestionThread.isSuggestionHandled()).toEqual(false);
    expect(suggestionThread.getSuggestionStatus()).toEqual('review');
    expect(suggestionThread.getSuggestionStateName()).toEqual('state_1');
    expect(suggestionThread.getReplacementHtmlFromSuggestion()).toEqual(
      'new suggestion content');

    messages = [{
      text: 'message1'
    }, {
      text: 'message2'
    }];
    suggestionThread.setMessages(messages);
    expect(suggestionThread.messages).toEqual(messages);
  });
});
