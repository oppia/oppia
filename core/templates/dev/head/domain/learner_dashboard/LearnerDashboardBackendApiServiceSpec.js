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
 * @fileoverview Unit tests for LearnerDashboardBackendApiService.
 */

describe('Learner Dashboard Backend API Service', function() {
  var LearnerDashboardBackendApiService = null;
  var $httpBackend = null;

  var sampleDataResults = {
    username: 'test',
    number_of_unread_threads: 0,
    completed_to_incomplete_collections: [],
    is_admin: false,
    profile_picture_data_url: 'TestURL',
    exploration_playlist: [],
    user_email: 'test@example.com',
    collection_playlist: [],
    is_moderator: false,
    number_of_nonexistent_activities: {
      completed_collections: 0,
      incomplete_collections: 0,
      collection_playlist: 0,
      incomplete_explorations: 0,
      exploration_playlist: 0,
      completed_explorations: 0
    },
    incomplete_collections_list: [],
    thread_summaries: [],
    incomplete_explorations_list: [],
    subscription_list: [],
    completed_explorations_list: [],
    is_super_admin: false,
    completed_collections_list: []
  };

  var LEARNER_DASHBOARD_DATA_URL = '/learnerdashboardhandler/data';
  var ERROR_STATUS_CODE = 500;

  beforeEach(module('oppia'));
  beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(inject(function($injector) {
    LearnerDashboardBackendApiService = $injector.get(
      'LearnerDashboardBackendApiService');
    $httpBackend = $injector.get('$httpBackend');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch learner dashboard data from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', LEARNER_DASHBOARD_DATA_URL).respond(
        sampleDataResults);
      LearnerDashboardBackendApiService.fetchLearnerDashboardData().then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(jasmine.objectContaining(
        {data: sampleDataResults}));
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it(
    'should use rejection handler if learner dashboard data ' +
    'backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', LEARNER_DASHBOARD_DATA_URL).respond(
        ERROR_STATUS_CODE, 'Error loading dashboard data.');
      LearnerDashboardBackendApiService.fetchLearnerDashboardData().then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(jasmine.objectContaining(
        {data: 'Error loading dashboard data.'}));
    });
});
