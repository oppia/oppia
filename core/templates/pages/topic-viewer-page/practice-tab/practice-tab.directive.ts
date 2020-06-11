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
 * @fileoverview Directive for the stories list.
 */

require('pages/practice-session-page/practice-session-page.constants.ajs.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/contextual/window-dimensions.service.ts');

angular.module('oppia').directive('practiceTab', [
  '$window', 'UrlInterpolationService',
  'PRACTICE_SESSIONS_URL',
  function(
      $window, UrlInterpolationService,
      PRACTICE_SESSIONS_URL) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getTopicName: '&topicName',
        getSubtopicsList: '&subtopicsList'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic-viewer-page/practice-tab/practice-tab.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope',
        function(
            $scope) {
          var ctrl = this;

          ctrl.openNewPracticeSession = function() {
            var selectedSubtopicIds = [];
            for (var idx in ctrl.selectedSubtopicIndices) {
              if (ctrl.selectedSubtopicIndices[idx]) {
                selectedSubtopicIds.push(
                  ctrl.availableSubtopics[idx].getId());
              }
            }
            var practiceSessionsUrl = UrlInterpolationService.interpolateUrl(
              PRACTICE_SESSIONS_URL, {
                topic_name: ctrl.getTopicName(),
                comma_separated_subtopic_ids: selectedSubtopicIds.join(',')
              });
            $window.location.href = practiceSessionsUrl;
          };

          ctrl.isStartButtonDisabled = function() {
            for (var idx in ctrl.selectedSubtopicIndices) {
              if (ctrl.selectedSubtopicIndices[idx]) {
                return false;
              }
            }
            return true;
          };

          ctrl.$onInit = function() {
            ctrl.selectedSubtopics = [];
            ctrl.availableSubtopics = ctrl.getSubtopicsList().filter(
              function(subtopic) {
                return subtopic.getSkillSummaries().length > 0;
              }
            );
            ctrl.selectedSubtopicIndices = Array(
              ctrl.availableSubtopics.length).fill(false);
          };
        }
      ]
    };
  }]);
