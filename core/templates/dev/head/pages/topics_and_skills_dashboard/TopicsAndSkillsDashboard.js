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
 * @fileoverview Controllers for the topics and skills dashboard.
 */
oppia.controller('TopicsAndSkillsDashboard', [
  '$scope', '$rootScope', '$http', '$window',
  'AlertsService', 'TopicsAndSkillsDashboardBackendApiService',
  'UrlInterpolationService', 'FATAL_ERROR_CODES',
  function(
      $scope, $rootScope, $http, $window,
      AlertsService, TopicsAndSkillsDashboardBackendApiService,
      UrlInterpolationService, FATAL_ERROR_CODES) {
    $scope.TAB_NAME_TOPICS = 'topics';
    $scope.TAB_NAME_SKILLS = 'skills';
    // As additional stories are not supported initially, it's not being shown,
    // for now.
    $scope.TOPIC_HEADINGS = [
      'name', 'subtopic_count', 'skill_count',
      'canonical_story_count'
    ];
    $scope.SKILL_HEADINGS = [
      'description', 'misconception_count', 'worked_examples_count'
    ];
    TopicsAndSkillsDashboardBackendApiService.fetchDashboardData().then(
      function(response) {
        $scope.topicSummaries = response.data.topic_summaries;
        $scope.skillSummaries = response.data.skill_summaries;
        $scope.activeTab = $scope.TAB_NAME_TOPICS;
        if ($scope.topicSummaries.length === 0 &&
            $scope.skillSummaries.length !== 0) {
          $scope.activeTab = $scope.TAB_NAME_SKILLS;
        }
      },
      function(errorResponse) {
        if (FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
          AlertsService.addWarning('Failed to get dashboard data');
        } else {
          AlertsService.addWarning('Unexpected error code from the server.');
        }
      }
    );

    $scope.setActiveTab = function(tabName) {
      $scope.activeTab = tabName;
    };

    $scope.getTopicEditorUrl = function(topicId) {
      return '/topic_editor/' + topicId;
    };

    $scope.getSkillEditorUrl = function(skillId) {
      return '/skill_editor/' + skillId;
    };
  }
]);
