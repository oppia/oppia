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

describe('Feedback message object factory', function() {
  var FeedbackMessageSummaryObjectFactory = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    FeedbackMessageSummaryObjectFactory = $injector.get(
      'FeedbackMessageSummaryObjectFactory');
  }));

  it('should create a new message', function() {
    feedbackMessage = FeedbackMessageSummaryObjectFactory.createNewMessage(
      'Sample message', 'Test user', 'profile_picture_url');

    expect(feedbackMessage.text).toEqual('Sample message');
    expect(feedbackMessage.authorUsername).toEqual('Test user');
    expect(feedbackMessage.authorPictureDataUrl).toEqual(
      'profile_picture_url');
  });

  it('should fetch the feedback message domain object from the backend ' +
     'summary dict', function() {
    messageSummary = {
      text: 'Sample text',
      author_username: 'User 1',
      author_picture_data_url: 'sample_picture_url_1',
      created_on: 1000
    };

    feedbackMessage = FeedbackMessageSummaryObjectFactory.createFromBackendDict(
      messageSummary);

    expect(feedbackMessage.text).toEqual('Sample text');
    expect(feedbackMessage.authorUsername).toEqual('User 1');
    expect(feedbackMessage.authorPictureDataUrl).toEqual(
      'sample_picture_url_1')
  });
});
