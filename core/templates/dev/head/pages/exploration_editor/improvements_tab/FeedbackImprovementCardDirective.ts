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

oppia.directive('feedbackImprovementCard', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getThread: '&data',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/improvements_tab/' +
        'feedback_improvement_card_directive.html'),
      controller: [
        '$scope', 'DateTimeFormatService', 'FeedbackDisplayService',
        function($scope, DateTimeFormatService, FeedbackDisplayService) {
          var getMessages = function() {
            return $scope.getThread().messages.filter(function(message) {
              return $.trim(message.text) !== '';
            });
          };
          $scope.getContextText = function() {
            var messageCount = getMessages().length;
            if ($scope.getThread().status === 'open') {
              if (messageCount === 0) {
                return null;
              } else if (messageCount === 1) {
                return 'New Thread:';
              } else {
                return 'Lateset Message:';
              }
            } else {
              return (messageCount === 1) ? null : 'Last Message:';
            }
          };
          $scope.getContextMessage = function() {
            var messages = getMessages();
            if (messages.length > 0) {
              return messages[messages.length - 1];
            } else {
              return {
                text: $scope.getThread().subject,
                author_username: $scope.getThread().originalAuthorName,
                created_on: $scope.getThread().lastUpdated,
              };
            }
          };
          $scope.getLabelClass = FeedbackDisplayService.getLabelClass;
          $scope.getHumanReadableStatus = (
            FeedbackDisplayService.getHumanReadableStatus);
          $scope.getLocaleAbbreviatedDatetimeString = (
            DateTimeFormatService.getLocaleAbbreviatedDatetimeString);
        }
      ],
    };
  }
]);
