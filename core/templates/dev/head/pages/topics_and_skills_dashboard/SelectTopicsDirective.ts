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
 * @fileoverview Controller for the select topics viewer.
 */
oppia.directive('selectTopics', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getTopicSummaries: '&topicSummaries',
        selectedTopicIds: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topics_and_skills_dashboard/select_topics_directive.html'),
      controller: [
        '$scope', '$uibModal', '$rootScope',
        function(
            $scope, $uibModal, $rootScope) {
          $scope.topicSummaries = $scope.getTopicSummaries();
          $scope.selectOrDeselectTopic = function(topicId, index) {
            if (!$scope.topicSummaries[index].isSelected) {
              $scope.selectedTopicIds.push(topicId);
              $scope.topicSummaries[index].isSelected = true;
            } else {
              var idIndex = $scope.selectedTopicIds.indexOf(topicId);
              $scope.selectedTopicIds.splice(idIndex, 1);
              $scope.topicSummaries[index].isSelected = false;
            }
          };
        }
      ]
    };
  }]);
