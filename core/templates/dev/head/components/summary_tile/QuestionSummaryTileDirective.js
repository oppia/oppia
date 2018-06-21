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
 * @fileoverview Summary tile for questions.
 */

oppia.constant(
  'QUESTION_EDITOR_URL', '/question_editor/<question_id>');

oppia.directive('questionSummaryTile', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getQuestionId: '&questionId',
        getDescription: '&description',
        getLastUpdatedMsec: '&lastUpdatedMsec',
        getStatus: '&status',
        getTaggedSkills: '=taggedSkills'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/summary_tile/' +
        'question_summary_tile_directive.html'),
      controller: [
        '$scope', 'DateTimeFormatService', 'QUESTION_EDITOR_URL', function(
            $scope, DateTimeFormatService, QUESTION_EDITOR_URL) {
          $scope.getLastUpdatedDatetime = function() {
            return DateTimeFormatService.getLocaleAbbreviatedDatetimeString(
              $scope.getLastUpdatedMsec());
          };

          $scope.getQuestionDescription = function () {
            if ($scope.getDescription()) {
              // TODO: This description needs to be converted to a readable
              // and meaningful text.
              return $scope.getDescription();
            } else {
              return 'This question is private. Tag it with a skill and ' +
              'publish it.';
            }
          };

          $scope.getQuestionLink = function() {
            var targetUrl = QUESTION_EDITOR_URL;
            return UrlInterpolationService.interpolateUrl(
              targetUrl, {
                question_id: $scope.getQuestionId()
              }
            );
          };

          $scope.getQuestionStripColor = function () {
            return constants.CATEGORIES_TO_COLORS[$scope.getStatus()];
          };

          $scope.setHoverState = function(hoverState) {
            $scope.questionIsCurrentlyHoveredOver = hoverState;
          };
        }
      ]
    };
  }]);
