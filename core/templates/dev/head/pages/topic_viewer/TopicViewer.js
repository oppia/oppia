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
 * @fileoverview Controllers for the topic viewer.
 */

oppia.controller('TopicViewer', [
  '$scope', '$rootScope', '$window', 'UrlService', 'FATAL_ERROR_CODES',
  'AlertsService', 'TopicViewerBackendApiService', 'UrlInterpolationService',
  function(
      $scope, $rootScope, $window, UrlService, FATAL_ERROR_CODES,
      AlertsService, TopicViewerBackendApiService, UrlInterpolationService) {
    $scope.setActiveTab = function(newActiveTabName) {
      $scope.activeTab = newActiveTabName;
    };
    $scope.setActiveTab('story');

    $scope.checkMobileView = function() {
      return ($window.innerWidth < 500);
    };
    $scope.topicId = UrlService.getPathname().split('/')[2];

    $rootScope.loadingMessage = 'Loading';
    TopicViewerBackendApiService.fetchTopicData($scope.topicId).then(
      function(response) {
        $scope.canonicalStoryList = response.canonical_story_dicts;
        $scope.topicName = response.topic_name;
        $rootScope.loadingMessage = '';
      },
      function(errorResponse) {
        if (FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
          AlertsService.addWarning('Failed to get dashboard data');
        }
      }
    );
  }
]);
