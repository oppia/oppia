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
  var $httpBackend = null;
  var sampleDataResults = null;
  var sampleExplorationStatsData = null;
  var SAMPLE_EXP_ID = 'hyuy4GUlvTqJ';

  beforeEach(module('oppia'));
  beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(inject(function($injector) {
    DashboardBackendApiService = $injector.get('DashboardBackendApiService');
    UrlInterpolationService = $injector.get('UrlInterpolationService');
    $httpBackend = $injector.get('$httpBackend');
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

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should use rejection handler if dashboard data backend request failed',
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
    expect(failHandler).toHaveBeenCalled();
  });

  it('should successfully fetch statistics for an exploration from the backend',
      function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect(
      'GET',
      '/dashboardhandler/explorationstats/?exp_id=' + SAMPLE_EXP_ID
    ).respond(
      sampleExplorationStatsData);
    DashboardBackendApiService.fetchExplorationStats(SAMPLE_EXP_ID).then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should use rejection handler if exploration stats backend request failed',
      function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    var ERROR_STATUS_CODE = 500;
    $httpBackend.expect(
      'GET',
      '/dashboardhandler/explorationstats/?exp_id=' + SAMPLE_EXP_ID
    ).respond(
      ERROR_STATUS_CODE, 'Error fetching exploration stats.');
    DashboardBackendApiService.fetchExplorationStats(SAMPLE_EXP_ID).then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  });
});
