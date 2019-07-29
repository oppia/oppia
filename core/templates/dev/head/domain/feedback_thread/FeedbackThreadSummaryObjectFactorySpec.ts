// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for FeedbackThreadSummaryObjectFactory.
 */

import { FeedbackThreadSummaryObjectFactory } from
  'domain/feedback_thread/FeedbackThreadSummaryObjectFactory.ts';

describe('Feedback thread object factory', () => {
  let feedbackThreadSummaryObjectFactory: FeedbackThreadSummaryObjectFactory;

  beforeEach(() => {
    feedbackThreadSummaryObjectFactory =
      new FeedbackThreadSummaryObjectFactory();
  });

  it('should update the summary of the thread on addition of a ' +
     ' message', () => {
    var feedbackThreadSummary = feedbackThreadSummaryObjectFactory.create(
      'open', 'Test user 1', new Date(), 'last message', 2, false, false,
      'Test user 2', 'Test user 2', 'Test exploration name', '0', 'thread_id');

    feedbackThreadSummary.appendNewMessage(
      'Looks good!', 'Test user 3');
    expect(feedbackThreadSummary.authorLastMessage).toEqual('Test user 3');
    expect(feedbackThreadSummary.lastMessageText).toEqual('Looks good!');
    expect(feedbackThreadSummary.totalMessageCount).toEqual(3);
  });

  it('should fetch the feedback thread domain object from the backend ' +
     'summary dict', () => {
    var threadSummary = {
      status: 'open',
      original_author_id: 'Test user 1',
      last_updated: 1000,
      last_message_text: 'last message',
      total_message_count: 2,
      last_message_is_read: false,
      second_last_message_is_read: true,
      author_last_message: 'Test user 2',
      author_second_last_message: 'Test user 1',
      exploration_title: 'Sample exploration 1',
      exploration_id: '0',
      thread_id: 'thread_id_1'
    };

    var feedbackThreadSummary = (
      feedbackThreadSummaryObjectFactory.createFromBackendDict(threadSummary));

    expect(feedbackThreadSummary.explorationTitle).toEqual(
      'Sample exploration 1');
    expect(feedbackThreadSummary.originalAuthorId).toEqual(
      'Test user 1');
    expect(feedbackThreadSummary.lastMessageText).toEqual(
      'last message');
    expect(feedbackThreadSummary.totalMessageCount).toEqual(2);
  });
});
