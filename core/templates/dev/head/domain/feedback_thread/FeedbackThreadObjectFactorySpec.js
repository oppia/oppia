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
 * @fileoverview Tests for FeedbackThreadObjectFactory.
 */

describe('Feedback thread object factory', function() {
  var FeedbackThreadObjectFactory = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    FeedbackThreadObjectFactory = $injector.get('FeedbackThreadObjectFactory');
  }));

  it('should update the summary of the thread on addition of a ' +
     ' message', function() {
    feedbackThread = FeedbackThreadObjectFactory.create(
      'open', 'Test user 1', new Date(), 'last message', 2, false, false,
      'Test user 2', 'Test user 2', 'Test exploration name', '0', 'thread_id');

    feedbackThread.updateSummaryOnNewMessage('Looks good!', 'Test user 3');
    expect(feedbackThread.authorLastMessage).toEqual('Test user 3');
    expect(feedbackThread.lastMessageText).toEqual('Looks good!');
    expect(feedbackThread.totalNoOfMessages).toEqual(3);
  });

  it('should fetch the feedback thread domain objects from backend ' +
     'dicts', function() {
    thread_summary_1 = {
      'status': 'open',
      'original_author_id': 'Test user 1',
      'last_updated': 1000,
      'last_message_text': 'last message',
      'total_no_of_messages': 2,
      'last_message_read': false,
      'second_last_message_read': true,
      'author_last_message': 'Test user 2',
      'author_second_last_message': 'Test user 1',
      'exploration_title': 'Sample exploration 1',
      'exploration_id': '0',
      'thread_id': 'thread_id_1'
    };

    thread_summary_2 = {
      'status': 'open',
      'original_author_id': 'Test user 3',
      'last_updated': 2000,
      'last_message_text': 'last message',
      'total_no_of_messages': 3,
      'last_message_read': false,
      'second_last_message_read': true,
      'author_last_message': 'Test user 4',
      'author_second_last_message': 'Test user 3',
      'exploration_title': 'Sample exploration 2',
      'exploration_id': '1',
      'thread_id': 'thread_id_2'
    };

    feedbackThreads = FeedbackThreadObjectFactory.createFromBackendDicts(
      [thread_summary_1, thread_summary_2]);

    expect(feedbackThreads[0].explorationTitle).toEqual(
      'Sample exploration 1');
    expect(feedbackThreads[1].explorationTitle).toEqual(
      'Sample exploration 2');
    expect(feedbackThreads[0].originalAuthorId).toEqual(
      'Test user 1');
    expect(feedbackThreads[1].originalAuthorId).toEqual(
      'Test user 3');
    expect(feedbackThreads[0].totalNoOfMessages).toEqual(2);
    expect(feedbackThreads[1].totalNoOfMessages).toEqual(3);
  });
});
