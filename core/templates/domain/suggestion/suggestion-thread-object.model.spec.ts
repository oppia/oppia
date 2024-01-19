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

import { SuggestionThread } from 'domain/suggestion/suggestion-thread-object.model';
import { ThreadMessage } from 'domain/feedback_message/ThreadMessage.model';
import { FeedbackThreadBackendDict } from 'domain/feedback_thread/FeedbackThreadObjectFactory';
import { SuggestionBackendDict } from './suggestion.model';

describe('SuggestionThreadObjectFactory', () => {
  let suggestionThreadBackendDict: FeedbackThreadBackendDict;
  let suggestionBackendDict: SuggestionBackendDict;

  beforeEach(() => {
    suggestionThreadBackendDict = {
      last_updated_msecs: 1000,
      original_author_username: 'author',
      status: 'accepted',
      subject: 'sample subject',
      summary: 'sample summary',
      message_count: 10,
      state_name: 'state 1',
      thread_id: 'exploration.exp1.thread1',
      last_nonempty_message_author: 'author',
      last_nonempty_message_text: 'tenth message',
    };
    suggestionBackendDict = {
      suggestion_id: 'exploration.exp1.thread1',
      suggestion_type: '',
      target_type: 'exploration',
      target_id: 'exp1',
      status: 'accepted',
      author_name: 'author',
      change_cmd: {
        skill_id: 'skill_id',
        state_name: 'state_1',
        new_value: { html: 'new suggestion content' },
        old_value: { html: 'old suggestion content' },
        content_id: 'content_id'
      },
      last_updated_msecs: 1000
    };
  });

  it('should create a new suggestion thread from a backend dict.', () => {
    suggestionBackendDict.suggestion_type =
      'edit_exploration_state_content';

    let suggestionThread =
    SuggestionThread.createFromBackendDicts(
      suggestionThreadBackendDict, suggestionBackendDict);

    expect(suggestionThread.lastUpdatedMsecs).toEqual(1000);
    expect(suggestionThread.originalAuthorName).toEqual('author');
    expect(suggestionThread.status).toEqual('accepted');
    expect(suggestionThread.subject).toEqual('sample subject');
    expect(suggestionThread.summary).toEqual('sample summary');
    expect(suggestionThread.messageCount).toEqual(10);
    expect(suggestionThread.threadId).toEqual('exploration.exp1.thread1');
    expect(suggestionThread.lastNonemptyMessageSummary.authorUsername)
      .toEqual('author');
    expect(suggestionThread.lastNonemptyMessageSummary.text)
      .toEqual('tenth message');

    let suggestion = suggestionThread.getSuggestion();
    expect(suggestion).not.toBeNull();
    expect(suggestion?.suggestionId).toEqual('exploration.exp1.thread1');
    expect(suggestion?.suggestionType)
      .toEqual('edit_exploration_state_content');
    expect(suggestion?.targetType).toEqual('exploration');
    expect(suggestion?.targetId).toEqual('exp1');
    expect(suggestion?.status).toEqual('accepted');
    expect(suggestion?.authorName).toEqual('author');
    expect(suggestion?.newValue.html).toEqual('new suggestion content');
    expect(suggestion?.oldValue.html).toEqual('old suggestion content');
    expect(suggestion?.lastUpdatedMsecs).toEqual(1000);
    expect(suggestion?.getThreadId()).toEqual('exploration.exp1.thread1');
    expect(suggestionThread.isSuggestionThread()).toBeTrue();
    expect(suggestionThread.isSuggestionHandled()).toBeTrue();

    suggestionThread.setSuggestionStatus('review');
    expect(suggestionThread.isSuggestionHandled()).toBeFalse();
    expect(suggestionThread.getSuggestionStatus()).toEqual('review');
    expect(suggestionThread.getSuggestionStateName()).toEqual('state_1');
    expect(suggestionThread.getReplacementHtmlFromSuggestion())
      .toEqual('new suggestion content');
  });

  it('should create a new suggestion thread.', () => {
    let suggestionThread =
    SuggestionThread.createFromBackendDicts(
      suggestionThreadBackendDict, suggestionBackendDict);

    expect(suggestionThread.lastUpdatedMsecs).toEqual(1000);
    expect(suggestionThread.originalAuthorName).toEqual('author');
    expect(suggestionThread.status).toEqual('accepted');
    expect(suggestionThread.subject).toEqual('sample subject');
    expect(suggestionThread.summary).toEqual('sample summary');
    expect(suggestionThread.messageCount).toEqual(10);
    expect(suggestionThread.threadId).toEqual('exploration.exp1.thread1');
    expect(suggestionThread.getSuggestion()).toBeNull();
  });

  describe('.setMessages', () => {
    it('should handle message getter and setter.', () => {
      let suggestionThread =
      SuggestionThread.createFromBackendDicts(
        suggestionThreadBackendDict, suggestionBackendDict);

      expect(suggestionThread.getMessages()).toEqual([]);

      let messages = [
        ThreadMessage.createFromBackendDict({
          author_username: 'author1',
          text: 'message1',
          created_on_msecs: 1000000,
          entity_type: 'exploration',
          entity_id: 'exp_id',
          message_id: 0,
          updated_status: 'status',
          updated_subject: 'subject',
        }),
        ThreadMessage.createFromBackendDict({
          author_username: 'author2',
          text: 'message2',
          created_on_msecs: 1000000,
          entity_type: 'exploration',
          entity_id: 'exp_id',
          message_id: 0,
          updated_status: 'status',
          updated_subject: 'subject',
        })
      ];

      suggestionThread.setMessages(messages);

      expect(suggestionThread.messages).toEqual(messages);
      expect(suggestionThread.messageCount).toEqual(messages.length);
      expect(suggestionThread.lastNonemptyMessageSummary.authorUsername)
        .toEqual('author2');
      expect(suggestionThread.lastNonemptyMessageSummary.text)
        .toEqual('message2');
    });
  });
});
