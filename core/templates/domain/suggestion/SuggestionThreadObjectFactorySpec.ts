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

import { TestBed } from '@angular/core/testing';

import { SuggestionThreadObjectFactory } from
  'domain/suggestion/SuggestionThreadObjectFactory';
import { ThreadMessageObjectFactory } from
  'domain/feedback_message/ThreadMessageObjectFactory';

describe('SuggestionThreadObjectFactory', () => {
  beforeEach(() => {
    this.suggestionThreadObjectFactory =
      TestBed.get(SuggestionThreadObjectFactory);
    this.threadMessageObjectFactory = TestBed.get(ThreadMessageObjectFactory);
  });

  beforeEach(() => {
    this.suggestionThreadBackendDict = {
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
    this.suggestionBackendDict = {
      suggestion_id: 'exploration.exp1.thread1',
      suggestion_type: '',
      target_type: 'exploration',
      target_id: 'exp1',
      target_version_at_submission: 1,
      status: 'accepted',
      author_name: 'author',
      change: {
        cmd: 'edit_state_property',
        property_name: 'content',
        state_name: 'state_1',
        new_value: { html: 'new suggestion content' },
        old_value: { html: 'old suggestion content' }
      },
      last_updated_msecs: 1000
    };
  });

  it('should create a new suggestion thread from a backend dict.', () => {
    this.suggestionBackendDict.suggestion_type =
      'edit_exploration_state_content';

    let suggestionThread =
      this.suggestionThreadObjectFactory.createFromBackendDicts(
        this.suggestionThreadBackendDict, this.suggestionBackendDict);

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
    expect(suggestion.suggestionId).toEqual('exploration.exp1.thread1');
    expect(suggestion.suggestionType)
      .toEqual('edit_exploration_state_content');
    expect(suggestion.targetType).toEqual('exploration');
    expect(suggestion.targetId).toEqual('exp1');
    expect(suggestion.status).toEqual('accepted');
    expect(suggestion.authorName).toEqual('author');
    expect(suggestion.newValue.html).toEqual('new suggestion content');
    expect(suggestion.oldValue.html).toEqual('old suggestion content');
    expect(suggestion.lastUpdatedMsecs).toEqual(1000);
    expect(suggestion.getThreadId()).toEqual('exploration.exp1.thread1');
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
      this.suggestionThreadObjectFactory.createFromBackendDicts(
        this.suggestionThreadBackendDict, this.suggestionBackendDict);

    expect(suggestionThread.lastUpdatedMsecs).toEqual(1000);
    expect(suggestionThread.originalAuthorName).toEqual('author');
    expect(suggestionThread.status).toEqual('accepted');
    expect(suggestionThread.subject).toEqual('sample subject');
    expect(suggestionThread.summary).toEqual('sample summary');
    expect(suggestionThread.messageCount).toEqual(10);
    expect(suggestionThread.threadId).toEqual('exploration.exp1.thread1');
    expect(suggestionThread.getSuggestion()).toBeNull();

    suggestionThread.setSuggestionStatus(null);

    expect(suggestionThread.isSuggestionHandled()).toBeNull();
    expect(suggestionThread.getSuggestionStatus()).toBeNull();
    expect(suggestionThread.getSuggestionStateName()).toBeNull();
    expect(suggestionThread.getReplacementHtmlFromSuggestion()).toBeNull();
  });

  describe('.setMessages', () => {
    it('should handle message getter and setter.', () => {
      let suggestionThread =
        this.suggestionThreadObjectFactory.createFromBackendDicts(
          this.suggestionThreadBackendDict, this.suggestionBackendDict);

      expect(suggestionThread.getMessages()).toEqual([]);

      let messages = [
        this.threadMessageObjectFactory.createFromBackendDict({
          author_username: 'author1',
          text: 'message1'
        }),
        this.threadMessageObjectFactory.createFromBackendDict({
          author_username: 'author2',
          text: 'message2'
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
