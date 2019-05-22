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
 * @fileoverview Controllers for the practice session.
 */

require(
  'components/common-layout-directives/background-banner/' +
  'background-banner.directive.ts');
require('pages/question-player-page/question-player-page.directive.ts');

require('services/AlertsService.ts');
require('services/contextual/UrlService.ts');

require('pages/practice-session-page/practice-session-page.constants.ts');

oppia.controller('PracticeSession', [
  '$http', '$rootScope', '$scope', 'AlertsService',
  'UrlInterpolationService', 'UrlService',
  'FATAL_ERROR_CODES', 'PRACTICE_SESSIONS_DATA_URL', 'TOTAL_QUESTIONS',
  function(
      $http, $rootScope, $scope, AlertsService,
      UrlInterpolationService, UrlService,
      FATAL_ERROR_CODES, PRACTICE_SESSIONS_DATA_URL, TOTAL_QUESTIONS
  ) {
    $scope.topicName = UrlService.getTopicNameFromLearnerUrl();
    var _fetchSkillDetails = function() {
      var practiceSessionsDataUrl = UrlInterpolationService.interpolateUrl(
        PRACTICE_SESSIONS_DATA_URL, {
          topic_name: $scope.topicName
        });
      $http.get(practiceSessionsDataUrl).then(function(result) {
        var questionPlayerConfig = {
          skillList: result.data.skill_list,
          questionCount: TOTAL_QUESTIONS
        };
        $scope.questionPlayerConfig = questionPlayerConfig;
      });
    };
    _fetchSkillDetails();
  }
]);
