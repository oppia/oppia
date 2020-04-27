// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for CommunityMessageBackendApiService.
 */

require('pages/community-dashboard-page/services/' +
  'community-message-backend-api.service.ts');

describe('Community Message Backend API Service', function() {
  var CommunityMessageBackendApiService = null;
  var $httpBackend = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    CommunityMessageBackendApiService = $injector.get(
      'CommunityMessageBackendApiService');
    $httpBackend = $injector.get('$httpBackend');
  }));

  it('should return correct community message data', function() {
    var requestUrl = '/community_message_handler';
    $httpBackend.expect('GET', requestUrl).respond(200, {
      community_message_enabled: true,
      community_message: 'test message'
    });

    CommunityMessageBackendApiService.getCommunityMessageData().then(
      function(data) {
        expect(data.communityMessageEnabled).toBe(true);
        expect(data.communityMessage).toBe('test message');
      });
    $httpBackend.flush();
  });
});
