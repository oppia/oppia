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
 * @fileoverview Controller for the navbar breadcrumb of the collection editor.
 */
oppia.directive('topicsList', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        topicSummaries: '&'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topics_and_skills_dashboard/topics_list_directive.html'),
      controller: ['$scope',
        function($scope) {
          // As additional stories are not supported initially, it's not
          // being shown, for now.
          $scope.TOPIC_HEADINGS = [
            'name', 'subtopic_count', 'skill_count',
            'canonical_story_count'
          ];
          $scope.getTopicEditorUrl = function(topicId) {
            return '/topic_editor/' + topicId;
          };
        }
      ]
    };
  }]);
