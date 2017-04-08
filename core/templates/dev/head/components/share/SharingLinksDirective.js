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
      shareType: '@',
      getTwitterText: '&twitterText',
      getExplorationId: '&explorationId',
      getCollectionId: '&collectionId'
    },
    templateUrl: 'components/sharingLinks',
    controller: [
      '$scope', '$window', 'oppiaHtmlEscaper', 'ExplorationEmbedButtonService',
      'siteAnalyticsService', 'UrlInterpolationService',
      function(
          $scope, $window, oppiaHtmlEscaper, ExplorationEmbedButtonService,
          siteAnalyticsService, UrlInterpolationService) {
        $scope.registerShareEvent = null;

        if ($scope.shareType === 'exploration') {
          $scope.explorationId = $scope.getExplorationId();

          $scope.activityType = 'explore';
          $scope.activityId = $scope.explorationId;

          $scope.registerShareEvent = (
            siteAnalyticsService.registerShareExplorationEvent);

          $scope.showEmbedExplorationModal = (
            ExplorationEmbedButtonService.showModal);
        } else if ($scope.shareType === 'collection') {
          $scope.collectionId = $scope.getCollectionId();

          $scope.activityType = 'collection';
          $scope.activityId = $scope.collectionId;

          $scope.registerShareEvent = (
            siteAnalyticsService.registerShareCollectionEvent);
        } else {
          throw Error(
            'SharingLinks directive can only be used either in the' +
            'collection player or the exploration player');
        }

        $scope.serverName = (
          $window.location.protocol + '//' + $window.location.host);

        $scope.escapedTwitterText = (
          oppiaHtmlEscaper.unescapedStrToEscapedStr($scope.getTwitterText()));

        $scope.gplusUrl = UrlInterpolationService.getStaticImageUrl(
          '/general/gplus.png');

        $scope.fbUrl = UrlInterpolationService.getStaticImageUrl(
          '/general/fb.png');

        $scope.twitterUrl = UrlInterpolationService.getStaticImageUrl(
          '/general/twitter.png');
      }
    ]
  };
}]);
