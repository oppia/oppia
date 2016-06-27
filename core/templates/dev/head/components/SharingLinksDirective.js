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
 * @fileoverview Directive for the Social Sharing Links.
 */

oppia.directive('sharingLinks', [function() {
  return {
    restrict: 'E',
    scope: {
      layoutType: '@',
      layoutAlignType: '@',
      getTwitterText: '&twitterText'
    },
    templateUrl: 'components/sharingLinks',
    controller: [
      '$scope', '$window', 'oppiaHtmlEscaper',
      'ExplorationEmbedButtonService', 'siteAnalyticsService',
      function(
        $scope, $window, oppiaHtmlEscaper, ExplorationEmbedButtonService,
        siteAnalyticsService) {
        var _explorationId = null;

        $scope.DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR = (
            GLOBALS.DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR);

        $scope.registerShareExplorationEvent = function(network) {
          siteAnalyticsService.registerShareExplorationEvent(network);
        };

        $scope.showEmbedExplorationModal = (
          ExplorationEmbedButtonService.showModal);

        $scope.serverName = (
          $window.location.protocol + '//' + $window.location.host);

        $scope.escapedTwitterText = (
          oppiaHtmlEscaper.unescapedStrToEscapedStr($scope.getTwitterText()));

        $scope.isNotDashboard = function() {
          var pathnameArray = $window.location.pathname.split('/');

          for (var i = 0; i < pathnameArray.length; i++) {
            if (pathnameArray[i] === 'explore' ||
                pathnameArray[i] === 'create') {
              console.log(pathnameArray);
              return true;
            } else if (pathnameArray[i] === 'dashboard') {
              console.log(pathnameArray);
              return false;
            }
          }
        };
        $scope.getExplorationId = function() {
          if (_explorationId) {
            return _explorationId;
          } else {
            // The pathname should be one of /explore/{exploration_id} or
            // /create/{exploration_id} .
            var pathnameArray = $window.location.pathname.split('/');

            for (var i = 0; i < pathnameArray.length; i++) {
              if (pathnameArray[i] === 'explore' ||
                  pathnameArray[i] === 'create') {
                _explorationId = pathnameArray[i + 1];
                return pathnameArray[i + 1];
              }
            }
          }
        };

        $scope.explorationId = $scope.getExplorationId();
      }
    ]
  };
}]);
