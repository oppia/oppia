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
        getData: '&data',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/improvements_tab/' +
        'feedback_improvement_card_directive.html'),
      controller: [
        '$scope', 'DateTimeFormatService', 'ThreadStatusDisplayService',
        function($scope, DateTimeFormatService, ThreadStatusDisplayService) {
          var getMessages = function() {
            return $scope.getData().messages.filter(function(msg) {
              return $.trim(msg.text) !== '';
            });
          };
          $scope.getMessageCount = function() {
            return getMessages().length;
          };
          $scope.getContextText = function() {
            var messageCount = getMessages().length;
            if ($scope.getData().status === 'open') {
              return (messageCount === 1) ? 'New Thread:' : 'Latest Message:';
            } else {
              return 'Last Message:';
            }
          }
          $scope.getContextMessage = function() {
            var messages = getMessages();
            return messages[messages.length - 1];
          };
          $scope.getContextAuthor = function(author) {
            var messages = getMessages();
            var author = null;
            if (messages.length > 1) {
              author = messages[messages.length - 1].author_username;
            } else {
              author = $scope.getData().originalAuthorName;
            }
            return author ? ('by ' + author) : '(anonymously submitted)';
          };
          $scope.getLabelClass = ThreadStatusDisplayService.getLabelClass;
          $scope.getHumanReadableStatus = (
            ThreadStatusDisplayService.getHumanReadableStatus);
          $scope.getLocaleAbbreviatedDatetimeString = (
            DateTimeFormatService.getLocaleAbbreviatedDatetimeString);
        }
      ],
    };
  }
]);
