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
 * @fileoverview Suggestion Improvement card directive.
 */

require('domain/utilities/UrlInterpolationService.ts');

angular.module('oppia').directive('suggestionImprovementCard', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getData: '&data',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration-editor-page/improvements-tab/' +
        'suggestion-improvement-card/' +
        'suggestion-improvement-card.directive.html'),
      controller: [
        '$scope', 'DateTimeFormatService', 'ThreadStatusDisplayService',
        function($scope, DateTimeFormatService, ThreadStatusDisplayService) {
          $scope.getLatestMessage = function() {
            var numMessages = $scope.getData().messages.length;
            if (numMessages > 1) {
              var latestMessage = $scope.getData().messages[numMessages - 1];
              return {
                text: latestMessage.text,
                author: latestMessage.author_username,
                updatedOn: latestMessage.created_on,
                updatedStatus: latestMessage.updated_status,
              };
            } else {
              return {
                text: $scope.getData().subject,
                author: $scope.getData().originalAuthorName,
                updatedOn: $scope.getData().lastUpdated,
                updatedStatus: null,
              };
            }
          };

          $scope.getStatusClass = function() {
            return ThreadStatusDisplayService.getLabelClass(
              $scope.getData().status);
          };

          $scope.getHumanReadableStatus = function() {
            return ThreadStatusDisplayService.getHumanReadableStatus(
              $scope.getData().status);
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

          $scope.getJson = function() {
            return angular.toJson($scope.getData(), true);
          };
        }
      ]
    };
  }
]);
