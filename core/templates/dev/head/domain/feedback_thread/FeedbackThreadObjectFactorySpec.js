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

describe('Feedback thread object factory', function() {
  beforeEach(module('oppia'));
  var FeedbackThreadObjectFactory = null;

  beforeEach(inject(function($injector) {
    FeedbackThreadObjectFactory = $injector.get('FeedbackThreadObjectFactory');
  }));

  it('should create a new feedback thread from a backend dict.', function() {
    var feedbackThreadBackendDict = {
      last_updated: 1000,
      original_author_username: 'author',
      status: 'accepted',
      subject: 'sample subject',
      summary: 'sample summary',
      message_count: 10,
      state_name: 'state 1',
      thread_id: 'exp1.thread1'
    };

    var feedbackThread = FeedbackThreadObjectFactory.createFromBackendDict(
      feedbackThreadBackendDict);
    expect(feedbackThread.status).toEqual('accepted');
    expect(feedbackThread.subject).toEqual('sample subject');
    expect(feedbackThread.summary).toEqual('sample summary');
    expect(feedbackThread.originalAuthorName).toEqual('author');
    expect(feedbackThread.lastUpdated).toEqual(1000);
    expect(feedbackThread.messageCount).toEqual(10);
    expect(feedbackThread.stateName).toEqual('state 1');
    expect(feedbackThread.threadId).toEqual('exp1.thread1');
    expect(feedbackThread.isSuggestionThread()).toEqual(false);

    var messages = [{
      text: 'message1'
    }, {
      text: 'message2'
    }];
    feedbackThread.setMessages(messages);
    expect(feedbackThread.messages).toEqual(messages);
  });
});
