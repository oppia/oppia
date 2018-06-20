// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for CreatorDashboardBackendApiService.
 */

describe('Topics and Skills Dashboard backend API service', function() {
  var TopicsAndSkillsDashboardBackendApiService = null;
  var $httpBackend = null;
  var SAMPLE_TOPIC_ID = 'hyuy4GUlvTqJ';

  var sampleDataResults = {
    topic_summary_dicts: [{
      id: SAMPLE_TOPIC_ID,
      name: 'Sample Name',
      language_code: 'en',
      version: 1,
      canonical_story_count: 3,
      additional_story_count: 0,
      uncategorized_skill_count: 3,
      subtopic_count: 3,
      topic_model_created_on: 1466178691847.67,
      topic_model_last_updated: 1466178759209.839
    }],
    skill_summary_dicts: []
  };

  var TOPICS_AND_SKILLS_DASHBOARD_DATA_URL =
    '/topics_and_skills_dashboard/data';
  var ERROR_STATUS_CODE = 500;

  beforeEach(module('oppia'));
  beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(inject(function($injector) {
    TopicsAndSkillsDashboardBackendApiService = $injector.get(
      'TopicsAndSkillsDashboardBackendApiService');
    UrlInterpolationService = $injector.get('UrlInterpolationService');
    $httpBackend = $injector.get('$httpBackend');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch topics and skills dashboard data from the ' +
      'backend',
  function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect('GET', TOPICS_AND_SKILLS_DASHBOARD_DATA_URL).respond(
      sampleDataResults);
    TopicsAndSkillsDashboardBackendApiService.fetchDashboardData().then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should use rejection handler if dashboard data backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', TOPICS_AND_SKILLS_DASHBOARD_DATA_URL).respond(
        ERROR_STATUS_CODE, 'Error loading dashboard data.');
      TopicsAndSkillsDashboardBackendApiService.fetchDashboardData().then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }
  );
});
