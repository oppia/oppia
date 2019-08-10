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
 * @fileoverview Tests for FeedbackMessageSummaryObjectFactory.
 */

import { FeedbackMessageSummaryObjectFactory } from
  'domain/feedback_message/FeedbackMessageSummaryObjectFactory.ts';

describe('Feedback message object factory', () => {
  let feedbackMessageSummaryObjectFactory: FeedbackMessageSummaryObjectFactory;

  beforeEach(() => {
    feedbackMessageSummaryObjectFactory =
      new FeedbackMessageSummaryObjectFactory();
  });

  it('should create a new message', () => {
    var feedbackMessageSummary = (
      feedbackMessageSummaryObjectFactory.createNewMessage(
        0, 'Sample message', 'Test user', 'profile_picture_url'));

    expect(feedbackMessageSummary.messageId).toEqual(0);
    expect(feedbackMessageSummary.text).toEqual('Sample message');
    expect(feedbackMessageSummary.authorUsername).toEqual('Test user');
    expect(feedbackMessageSummary.authorPictureDataUrl).toEqual(
      'profile_picture_url');
  });

  it('should fetch the feedback message domain object from the backend ' +
     'summary dict', () => {
    var messageSummary = {
      messageId: 0,
      text: 'Sample text',
      updatedStatus: null,
      author_username: 'User 1',
      author_picture_data_url: 'sample_picture_url_1',
      created_on: 1000
    };

    var feedbackMessageSummary = (
      feedbackMessageSummaryObjectFactory.createFromBackendDict(
        messageSummary));

    expect(feedbackMessageSummary.text).toEqual('Sample text');
    expect(feedbackMessageSummary.authorUsername).toEqual('User 1');
    expect(feedbackMessageSummary.authorPictureDataUrl).toEqual(
      'sample_picture_url_1');
  });
});
