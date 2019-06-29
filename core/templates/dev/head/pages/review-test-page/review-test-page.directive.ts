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
 * @fileoverview Directive for the review tests page.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.directive.ts');
require(
  'components/question-directives/question-player/' +
  'question-player.directive.ts');
require('interactions/interactionsQuestionsRequires.ts');
require('objects/objectComponentsRequiresForPlayers.ts');
require('pages/interaction-specs.constants.ts');
require('pages/review-test-page/review-test-page.constants.ts');
require('pages/review-test-page/review-test-engine.service.ts');
require('services/AlertsService.ts');
require('services/contextual/UrlService.ts');

oppia.directive('reviewTestPage', ['UrlInterpolationService', function(
    UrlInterpolationService) {
  return {
    restrict: 'E',
    scope: {},
    bindToController: {},
    templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
      '/pages/review-test-page/review-test-page.directive.html'),
    controllerAs: '$ctrl',
    controller: [
      '$http', '$rootScope', 'AlertsService', 'ReviewTestEngineService',
      'UrlInterpolationService', 'UrlService',
      'FATAL_ERROR_CODES', 'REVIEW_TEST_DATA_URL',
      function(
          $http, $rootScope, AlertsService, ReviewTestEngineService,
          UrlInterpolationService, UrlService,
          FATAL_ERROR_CODES, REVIEW_TEST_DATA_URL
      ) {
        var ctrl = this;
        ctrl.storyId = UrlService.getStoryIdFromUrl();
        ctrl.questionPlayerConfig = null;

        var _fetchSkillDetails = function() {
          var reviewTestsDataUrl = UrlInterpolationService.interpolateUrl(
            REVIEW_TEST_DATA_URL, {
              story_id: ctrl.storyId
            });
          $http.get(reviewTestsDataUrl).then(function(result) {
            var skillIdList = [];
            var skillDescriptions = [];
            for (var skillId in result.data.skill_descriptions) {
              skillIdList.push(skillId);
              skillDescriptions.push(
                result.data.skill_descriptions[skillId]);
            }
            var questionPlayerConfig = {
              skillList: skillIdList,
              skillDescriptions: skillDescriptions,
              questionCount: ReviewTestEngineService.getReviewTestQuestionCount(
                skillIdList.length)
            };
            ctrl.questionPlayerConfig = questionPlayerConfig;
          });
        };
        _fetchSkillDetails();
      }
    ]
  };
}]);
