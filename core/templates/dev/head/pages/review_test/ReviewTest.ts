// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controllers for the review tests.
 */
oppia.constant('REVIEW_TEST_DATA_URL', 'review_test/data/<story_id>');

require('pages/question_player/QuestionPlayerDirective.ts');
require('pages/review_test/ReviewTestEngineService.ts');

oppia.controller('ReviewTest', [
  '$http', '$rootScope', '$scope', 'AlertsService',
  'ReviewTestEngineService',
  'UrlInterpolationService', 'UrlService',
  'FATAL_ERROR_CODES', 'REVIEW_TEST_DATA_URL',
  function(
      $http, $rootScope, $scope, AlertsService,
      ReviewTestEngineService,
      UrlInterpolationService, UrlService,
      FATAL_ERROR_CODES, REVIEW_TEST_DATA_URL,
  ) {
    $scope.storyId = UrlService.getStoryIdFromUrl();
    var _fetchSkillDetails = function() {
      var reviewTestsDataUrl = UrlInterpolationService.interpolateUrl(
        REVIEW_TEST_DATA_URL, {
          story_id: $scope.storyId
        });
      $http.get(reviewTestsDataUrl).then(function(result) {
        var questionPlayerConfig = {
          skillList: result.data.skill_list,
          questionCount: ReviewTestEngineService.getReviewTestTotalQuestions(
            result.data.skill_list.length)
        };
        $scope.questionPlayerConfig = questionPlayerConfig;
      });
    };
    _fetchSkillDetails();
  }
]);
