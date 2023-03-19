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
 * @fileoverview Tests for FeedbackMessageSummaryModel.
 */

import { FeedbackMessageSummary } from
  'domain/feedback_message/feedback-message-summary.model';

describe('Feedback message model', () => {
  it('should create a new message', () => {
    var feedbackMessageSummary = (
      FeedbackMessageSummary.createNewMessage(
        0, 'Sample message', 'Test user'));

    expect(feedbackMessageSummary.messageId).toEqual(0);
    expect(feedbackMessageSummary.text).toEqual('Sample message');
    expect(feedbackMessageSummary.authorUsername).toEqual('Test user');
  });

  it('should fetch the feedback message domain object from the backend ' +
     'summary dict', () => {
    var messageSummary = {
      message_id: 0,
      text: 'Sample text',
      updated_status: null,
      suggestion_html: 'html',
      current_content_html: 'html',
      description: 'desc',
      author_username: 'User 1',
      created_on_msecs: 1000
    };

    var feedbackMessageSummary = (
      FeedbackMessageSummary.createFromBackendDict(
        messageSummary));

    expect(feedbackMessageSummary.text).toEqual('Sample text');
    expect(feedbackMessageSummary.authorUsername).toEqual('User 1');
    expect(feedbackMessageSummary.createdOnMsecs).toEqual(1000);
  });
});
