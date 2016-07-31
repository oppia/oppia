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
 * @fileoverview Unit tests for DashboardBackendApiService.
 */

describe('Dashboard backend API service', function() {
  var DashboardBackendApiService = null;
  var sampleDataResults = null;
  var $httpBackend = null;

  beforeEach(module('oppia'));
  beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(inject(function($injector) {
    DashboardBackendApiService = $injector.get('DashboardBackendApiService');
    UrlInterpolationService = $injector.get('UrlInterpolationService');
    $httpBackend = $injector.get('$httpBackend');

    // Sample dashboard data returnable from the backend
    sampleDataResults = {
      explorations_list: [{
        id: 'hyuy4GUlvTqJ',
        title: 'Sample Title',
        activity_type: 'exploration',
        category: 'Computing',
        objective: 'Sample objective',
        language_code: 'en',
        created_on_msec: 1466178691847.67,
        last_updated_msec: 1466178759209.839,
        status: 'public',
        ratings: {
          5: 0,
          4: 1,
          3: 0,
          2: 0,
          1: 0
        },
        community_owned: false,
        tags: '',
        thumbnail_icon_url: UrlInterpolationService.getStaticImageUrl(
          '/subjects/Computing.svg'),
        thumbnail_bg_color: '#bb8b2f',
        num_views: 2,
        num_open_threads: 0,
        num_total_threads: 0,
        num_unresolved_answers: 2
      }],
      collections_list: [],
      dashboard_stats: {
        total_plays: 10,
        num_ratings: 1,
        average_ratings: 4.0,
        total_open_feedback: 5
      },
      last_week_stats: {
        total_plays: 2,
        average_ratings: 3.5,
        num_ratings: 3,
        total_open_feedback: 1
      }
    };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch an creator dashboard data from the backend',
      function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect('GET', '/dashboardhandler/data').respond(
      sampleDataResults);
    DashboardBackendApiService.fetchDashboardData().then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should use the rejection handler if the backend request failed',
      function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    var ERROR_STATUS_CODE = 500;
    $httpBackend.expect('GET', '/dashboardhandler/data').respond(
      ERROR_STATUS_CODE, 'Error loading dashboard data.');
    DashboardBackendApiService.fetchDashboardData().then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(ERROR_STATUS_CODE);
  });
});
