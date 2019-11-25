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
 * @fileoverview Unit tests for FeedbackThreadObjectFactory.
 */

import { TestBed } from '@angular/core/testing';

import { FeedbackThreadObjectFactory } from
  'domain/feedback_thread/FeedbackThreadObjectFactory';

describe('Feedback thread object factory', () => {
  var feedbackThreadObjectFactory: FeedbackThreadObjectFactory = null;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FeedbackThreadObjectFactory]
    });

    feedbackThreadObjectFactory = TestBed.get(FeedbackThreadObjectFactory);
  });

  it('should create a new feedback thread from a backend dict.', () => {
    var feedbackThreadBackendDict = {
      last_updated: 1000,
      original_author_username: 'author',
      status: 'accepted',
      subject: 'sample subject',
      summary: 'sample summary',
      message_count: 10,
      state_name: 'state 1',
      thread_id: 'exp1.thread1',
      last_message_text: 'last message',
      last_message_author: 'author',
      second_last_message_text: 'first message',
      second_last_message_author: 'author',
    };

    var feedbackThread = feedbackThreadObjectFactory.createFromBackendDict(
      feedbackThreadBackendDict);
    expect(feedbackThread.status).toEqual('accepted');
    expect(feedbackThread.subject).toEqual('sample subject');
    expect(feedbackThread.summary).toEqual('sample summary');
    expect(feedbackThread.originalAuthorName).toEqual('author');
    expect(feedbackThread.lastUpdated).toEqual(1000);
    expect(feedbackThread.messageCount).toEqual(10);
    expect(feedbackThread.stateName).toEqual('state 1');
    expect(feedbackThread.threadId).toEqual('exp1.thread1');
    expect(feedbackThread.lastMessageText).toEqual('last message');
    expect(feedbackThread.lastMessageAuthor).toEqual('author');
    expect(feedbackThread.secondLastMessageText).toEqual('first message');
    expect(feedbackThread.secondLastMessageAuthor).toEqual('author');
    expect(feedbackThread.isSuggestionThread()).toEqual(false);

    var messages = [
      {text: 'first message'},
      {text: 'last message'},
    ];
    feedbackThread.setMessages(messages);
    expect(feedbackThread.messages).toEqual(messages);
  });
});
