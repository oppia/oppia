// Copyright 2024 The Oppia Authors.
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
 * @fileoverview Unit tests for FeedbackThread model.
 */

import { FeedbackThread } from './feedback-thread.model';
import { ThreadMessageSummary } from '../feedback_message/ThreadMessageSummary.model';
import { ThreadMessage } from '../feedback_message/ThreadMessage.model';

describe('FeedbackThread model', () => {
  it('should create a thread from backend dict', () => {
    const thread = FeedbackThread.createFromBackendDict({
      status: 'open',
      subject: 'Feedback about lesson 1',
      summary: 'Initial feedback from learner',
      original_author_username: 'learner123',
      last_updated_msecs: 1687000000000,
      message_count: 1,
      state_name: 'Introduction',
      thread_id: 'exp1.thread1',
      last_nonempty_message_author: 'learner123',
      last_nonempty_message_text: 'Great explanation!'
    });

    expect(thread.status).toEqual('open');
    expect(thread.subject).toEqual('Feedback about lesson 1');
    expect(thread.summary).toEqual('Initial feedback from learner');
    expect(thread.originalAuthorName).toEqual('learner123');
    expect(thread.lastUpdatedMsecs).toEqual(1687000000000);
    expect(thread.messageCount).toEqual(1);
    expect(thread.stateName).toEqual('Introduction');
    expect(thread.threadId).toEqual('exp1.thread1');
    expect(thread.lastNonemptyMessageSummary).toEqual(
      new ThreadMessageSummary('learner123', 'Great explanation!')
    );
    expect(thread.isSuggestionThread()).toBeFalse();
  });

  it('should update messages and message-related fields correctly', () => {
    const thread = FeedbackThread.createFromBackendDict({
      status: 'open',
      subject: 'Follow-up on lesson 1',
      summary: 'Discussion continued',
      original_author_username: 'userA',
      last_updated_msecs: 1688000000000,
      message_count: 1,
      state_name: 'Conclusion',
      thread_id: 'exp1.thread2',
      last_nonempty_message_author: 'userA',
      last_nonempty_message_text: 'Let’s discuss further'
    });

    const messages = [
      ThreadMessage.createFromBackendDict({
        author_username: 'userA',
        text: 'Initial message',
        updated_subject: null,
        created_on_msecs: 1688000000000,
        entity_type: 'exploration',
        entity_id: 'exp1',
        message_id: 0,
        updated_status: null
      }),
      ThreadMessage.createFromBackendDict({
        author_username: 'userB',
        text: 'Second message',
        updated_subject: null,
        created_on_msecs: 1688000005000,
        entity_type: 'exploration',
        entity_id: 'exp1',
        message_id: 1,
        updated_status: null
      })
    ];

    thread.setMessages(messages);

    expect(thread.getMessages()).toEqual(messages);
    expect(thread.messageCount).toEqual(2);
    expect(thread.lastNonemptyMessageSummary.authorUsername).toEqual('userB');
    expect(thread.lastNonemptyMessageSummary.text).toEqual('Second message');
  });
});
