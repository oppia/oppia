// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for threadDataService, which retrieves thread
 * data for the feedback tab of the exploration editor.
 *
 * @author allan.zhou@berkeley.edu (Allan Zhou)
 */

describe('retrieving threads service', function() {
  var expId = '12345';
  beforeEach(function() {
    module('oppia');
    module(function($provide) {
      $provide.value('explorationData', { explorationId: expId });
    });
  });

  var threadDataService, httpBackend;
  beforeEach(inject(function(_threadDataService_, $httpBackend) {
    threadDataService = _threadDataService_;
    httpBackend = $httpBackend;
  }));

  it('should retrieve feedback threads', function() {
    var mockFeedbackThreads = [
      {
        last_updated: 1441870501230.642,
        original_author_username: 'test_author',
        state_name: null,
        status: 'open',
        subject: 'example feedback',
        summary: null,
        threadId: 'abc1'
      },
      {
        last_updated: 1441870501231.642,
        original_author_username: 'test_author',
        state_name: null,
        status: 'open',
        subject: 'example feedback',
        summary: null,
        threadId: 'abc2'
      }
    ];

    var mockOpenSuggestionThreads = [
      {
        last_updated: 1441870501232.642,
        original_author_username: 'test_author',
        state_name: null,
        status: 'open',
        subject: 'example suggestion',
        summary: null,
        threadId: 'abc3',
        suggestion_id: '1'
      },
      {
        last_updated: 1441870501233.642,
        original_author_username: 'test_author',
        state_name: null,
        status: 'open',
        subject: 'example suggestion',
        summary: null,
        threadId: 'abc4',
        suggestion_id: '2'
      }
    ];

    httpBackend.whenGET('/threadlisthandler/' + expId).respond({
      threads: mockFeedbackThreads
    });

    httpBackend.whenGET('/suggestionlisthandler/' + expId + '?type=open').respond({
      threads: mockOpenSuggestionThreads
    });

    threadDataService.fetchThreads();
    httpBackend.flush();

    for (var i = 0; i < mockFeedbackThreads.length; i++) {
      expect(threadDataService.data.threadList).toContain(mockFeedbackThreads[i]);
    }
    for (var i = 0; i < mockOpenSuggestionThreads.length; i++) {
      expect(threadDataService.data.threadList).toContain(mockOpenSuggestionThreads[i]);
    }
  });
});
