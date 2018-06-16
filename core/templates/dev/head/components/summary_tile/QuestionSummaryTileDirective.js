// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
  'QUESTION_VIEWER_URL', '/question/<question_id>');
oppia.constant(
  'QUESTION_EDITOR_URL', '/questioncreationhandler/<question_id>');

oppia.directive('questionSummaryTile', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getQuestionId: '&questionId',
        getDescription: '&description',
        getLastUpdatedMsec: '&lastUpdatedMsec',
        getStatus: '&status'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/summary_tile/' +
        'question_summary_tile_directive.html'),
      controller: [
        '$scope', 'DateTimeFormatService',
        'QUESTION_VIEWER_URL', 'QUESTION_EDITOR_URL', function(
            $scope, DateTimeFormatService,
            QUESTION_VIEWER_URL, QUESTION_EDITOR_URL) {
          $scope.userIsLoggedIn = GLOBALS.userIsLoggedIn;
          $scope.DEFAULT_EMPTY_DESCRIPTION = 'Question is empty';
          $scope.ACTIVITY_TYPE_QUESTION = constants.ACTIVITY_TYPE_QUESTION;

          $scope.getLastUpdatedDatetime = function() {
            return DateTimeFormatService.getLocaleAbbreviatedDatetimeString(
              $scope.getLastUpdatedMsec());
          };

          $scope.getQuestionLink = function() {
            var targetUrl = (
              $scope.isLinkedToEditorPage ?
                QUESTION_EDITOR_URL : QUESTION_VIEWER_URL);
            return UrlInterpolationService.interpolateUrl(
              targetUrl, {
                question_id: $scope.getQuestionId()
              }
            );
          };

          $scope.getQuestionStripColor = function () {
            status = $scope.getStatus();
            return constants.CATEGORIES_TO_COLORS[status];
          };

          $scope.setHoverState = function(hoverState) {
            $scope.questionIsCurrentlyHoveredOver = hoverState;
          };
        }
      ]
    };
  }]);
