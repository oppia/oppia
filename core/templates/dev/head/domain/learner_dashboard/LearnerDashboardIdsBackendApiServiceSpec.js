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
 * @fileoverview Unit tests for LearnerDashboardIdsBackendApiService.
 */

describe('Learner Dashboard Backend API Service', function() {
  var LearnerDashboardIdsBackendApiService = null;
  var $httpBackend = null;

  var sampleDataResults = {
    username: 'test',
    profile_picture_data_url: 'TestURL',
    learner_dashboard_activity_ids: {
      completed_exploration_ids: [],
      exploration_playlist_ids: [],
      completed_collection_ids: [],
      incomplete_exploration_ids: [],
      collection_playlist_ids: [],
      incomplete_collection_ids: []
    },
    user_email: 'test@example.com',
    is_admin: false,
    is_super_admin: false,
    is_moderator: false
  };

  var LEARNER_DASHBOARD_IDS_DATA_URL = '/learnerdashboardidshandler/data';
  var ERROR_STATUS_CODE = 500;

  beforeEach(module('oppia'));
  beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(inject(function($injector) {
    LearnerDashboardIdsBackendApiService = $injector.get(
      'LearnerDashboardIdsBackendApiService');
    UrlInterpolationService = $injector.get('UrlInterpolationService');
    $httpBackend = $injector.get('$httpBackend');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch learner dashboard IDs data from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', LEARNER_DASHBOARD_IDS_DATA_URL).respond(
        sampleDataResults);
      LearnerDashboardIdsBackendApiService.fetchLearnerDashboardIds().then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(jasmine.objectContaining(
        {data : sampleDataResults}));
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should use rejection handler if learner dashboard IDs' +
    ' data backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', LEARNER_DASHBOARD_IDS_DATA_URL).respond(
        ERROR_STATUS_CODE, 'Error loading dashboard IDs data.');
      LearnerDashboardIdsBackendApiService.fetchLearnerDashboardIds().then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(jasmine.objectContaining(
        {data : 'Error loading dashboard IDs data.'}));
    }
  );
});
