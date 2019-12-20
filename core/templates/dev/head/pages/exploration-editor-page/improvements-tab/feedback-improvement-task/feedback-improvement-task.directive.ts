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
 * @fileoverview Feedback Improvement task directive.
 */

require('domain/utilities/url-interpolation.service.ts');

angular.module('oppia').directive('feedbackImprovementTask', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getData: '&data',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration-editor-page/improvements-tab/' +
        'feedback-improvement-task/' +
        'feedback-improvement-task.directive.html'),
      controller: [
        '$scope', 'DateTimeFormatService', 'ThreadStatusDisplayService',
        function($scope, DateTimeFormatService, ThreadStatusDisplayService) {
          $scope.getLatestMessage = function() {
            var numMessages = $scope.getData().messages.length;
            if (numMessages > 0) {
              var latestMessage = $scope.getData().messages[numMessages - 1];
              var threadIsNewlyOpened =
                numMessages === 1 && latestMessage.updated_status === 'open';
              return {
                text: latestMessage.text,
                author: latestMessage.author_username,
                updatedOn: latestMessage.created_on,
                updatedStatus: (
                  threadIsNewlyOpened ? null : latestMessage.updated_status),
              };
            } else {
              return {
                text: '',
                author: $scope.getData().originalAuthorName,
                updatedOn: $scope.getData().lastUpdated,
                updatedStatus: null,
              };
            }
          };

          $scope.getHumanReadableUpdatedStatus = function() {
            var updatedStatus = $scope.getLatestMessage().updatedStatus;
            return updatedStatus === null ? null :
              ThreadStatusDisplayService.getHumanReadableStatus(updatedStatus);
          };

          $scope.getLocaleAbbreviatedDatetimeString = function() {
            return DateTimeFormatService.getLocaleAbbreviatedDatetimeString(
              $scope.getLatestMessage().updatedOn);
          };
        }
      ]
    };
  }
]);
