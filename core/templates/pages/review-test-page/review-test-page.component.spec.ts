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
 * @fileoverview Unit tests for reviewTestPage.
 */

import { TestBed } from '@angular/core/testing';
import { ReviewTestBackendApiService } from
  'domain/review_test/review-test-backend-api.service';
import { PageTitleService } from 'services/page-title.service';
import { ReviewTestEngineService } from
  'pages/review-test-page/review-test-engine.service';
import { importAllAngularServices } from 'tests/unit-test-utils';

describe('Review test page component', function() {
  var ctrl = null;
  var $q = null;
  var $scope = null;
  var pageTitleService = null;
  var reviewTestBackendApiService = null;
  var reviewTestEngineService = null;
  var urlService = null;

  importAllAngularServices();

  beforeEach(function() {
    pageTitleService = TestBed.get(PageTitleService);
    reviewTestBackendApiService = TestBed.get(ReviewTestBackendApiService);
    reviewTestEngineService = TestBed.get(ReviewTestEngineService);
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('ReviewTestBackendApiService', reviewTestBackendApiService);
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    var $rootScope = $injector.get('$rootScope');
    urlService = $injector.get('UrlService');

    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'topic_1');
    spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
      'story_1');
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'classroom_1');

    $scope = $rootScope.$new();
    ctrl = $componentController('reviewTestPage', {
      PageTitleService: pageTitleService,
      ReviewTestEngineService: reviewTestEngineService
    });

    // This approach was choosen because spyOn() doesn't work on properties
    // that doesn't have a get access type.
    // Without this approach the test will fail because it'll throw
    // 'Property reviewTestBackendApiService does not have access type get'
    // or 'Property reviewTestBackendApiService does not have access type set'
    // error.
    Object.defineProperty(ctrl, 'reviewTestBackendApiService', {
      get: () => undefined,
      set: () => {}
    });

    spyOnProperty(ctrl, 'reviewTestBackendApiService').and.returnValue(
      reviewTestBackendApiService);
    spyOn(
      reviewTestBackendApiService, 'fetchReviewTestDataAsync').and.returnValue(
      $q.resolve({
        storyName: '',
        skillDescriptions: ['skill_1', 'skill_2']
      }));

    ctrl.$onInit();
    $scope.$apply();
  }));

  it('should initialize correctly controller properties after its' +
  ' initialization and get skill details from backend', function() {
    expect(ctrl.questionPlayerConfig).toEqual({
      resultActionButtons: [{
        type: 'BOOST_SCORE',
        i18nId: 'I18N_QUESTION_PLAYER_BOOST_SCORE'
      }, {
        type: 'RETRY_SESSION',
        i18nId: 'I18N_QUESTION_PLAYER_RETRY_TEST',
        url: '/learn/classroom_1/topic_1/review-test/story_1'
      }, {
        type: 'DASHBOARD',
        i18nId: 'I18N_QUESTION_PLAYER_RETURN_TO_STORY',
        url: '/learn/classroom_1/topic_1/story/story_1'
      }],
      skillList: ['0', '1'],
      skillDescriptions: ['skill_1', 'skill_2'],
      questionCount: 6,
      questionPlayerMode: {
        modeType: 'PASS_FAIL',
        passCutoff: 0.75
      },
      questionsSortedByDifficulty: true
    });
  });
});
