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
 * @fileoverview Tests for FeedbackMessageObjectFactory.
 */

describe('Feedback message object factory', function() {
  var FeedbackMessageObjectFactory = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    FeedbackMessageObjectFactory = $injector.get(
      'FeedbackMessageObjectFactory');
  }));

  it('should fetch the feedback message domain objects from backend ' +
     'dicts', function() {
    messageSummary1 = {
      text: 'Sample text',
      author_username: 'User 1',
      author_picture_data_url: 'sample_picture_url_1',
      created_on: 1000
    };

    messageSummary2 = {
      suggestion_html: 'suggested html',
      current_content_html: 'current html',
      description: 'description',
      author_username: 'User 2',
      author_picture_data_url: 'sample_picture_url_2'
    };

    feedbackMessages = FeedbackMessageObjectFactory.createFromBackendDicts(
      [messageSummary1, messageSummary2]);

    expect(feedbackMessages[0].text).toEqual('Sample text');
    expect(feedbackMessages[0].authorUsername).toEqual('User 1');

    expect(feedbackMessages[1].suggestionHtml).toEqual('suggested html');
    expect(feedbackMessages[1].currentContentHtml).toEqual('current html');
    expect(feedbackMessages[1].authorUsername).toEqual('User 2');
  });
});
