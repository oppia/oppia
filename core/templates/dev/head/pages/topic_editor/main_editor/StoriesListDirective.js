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
 * @fileoverview Controller for the stories list viewer.
 */
oppia.directive('storiesList', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getStorySummaries: '&storySummaries'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic_editor/main_editor/stories_list_directive.html'),
      controller: [
        '$scope', 'EditableTopicBackendApiService', 'UrlService',
        'UrlInterpolationService',
        function(
            $scope, EditableTopicBackendApiService, UrlService,
            UrlInterpolationService) {
          var topicId = UrlService.getTopicIdFromUrl();
          var storyEditorUrlTemplate = '/story_editor/<topic_id>/<story_id>';
          $scope.STORY_TABLE_COLUMN_HEADINGS = ['title', 'node_count'];
          $scope.getStoryEditorUrl = function(storyId) {
            return UrlInterpolationService.interpolateUrl(
              storyEditorUrlTemplate, {
                topic_id: topicId,
                story_id: storyId
              });
          };
        }
      ]
    };
  }]);
