// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controllers for the learner view breadcrumb section of the navbar.
 *
 * @author sean@seanlip.org (Sean Lip)
 */

oppia.controller('LearnerViewBreadcrumb', [
  '$scope', '$modal', function($scope, $modal) {
    $scope.showInformationCard = function() {
      $modal.open({
        animation: true,
        templateUrl: 'modal/informationCard',
        windowClass: 'oppia-modal-information-card',
        controller: [
          '$scope', '$http', '$window', '$modal', '$modalInstance',
          'oppiaHtmlEscaper', 'embedExplorationButtonService',
          'oppiaDatetimeFormatter', 'ratingComputationService',
          'explorationContextService',
          function($scope, $http, $window, $modal, $modalInstance,
                   oppiaHtmlEscaper, embedExplorationButtonService,
                   oppiaDatetimeFormatter, ratingComputationService,
                   explorationContextService) {

            var getExplorationTagsSummary = function(arrayOfTags) {
              var tagsToShow =[];
              var tagsInTooltip = [];
              var MAX_CHARS_TO_SHOW = 45;

              for (var i = 0; i < arrayOfTags.length; i++) {
                var newLength = (
                  tagsToShow.toString() + arrayOfTags[i]).length;

                if (newLength < MAX_CHARS_TO_SHOW) {
                  tagsToShow.push(arrayOfTags[i]);
                } else {
                  tagsInTooltip.push(arrayOfTags[i]);
                }
              };

              return {
                tagsToShow: tagsToShow,
                tagsInTooltip: tagsInTooltip
              };
            };

            var getLastUpdatedString = function(millisSinceEpoch) {
              return oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString(
                millisSinceEpoch);
            };

            var explorationId = explorationContextService.getExplorationId();
            $scope.serverName = (
              $window.location.protocol + '//' + $window.location.host);
            $scope.hasInfoCardLoaded = false;
            $scope.hasInfoCardFailedToLoad = false;
            $scope.escapedTwitterText = oppiaHtmlEscaper.unescapedStrToEscapedStr(
              GLOBALS.SHARING_OPTIONS_TWITTER_TEXT);
            $scope.showEmbedExplorationModal = (
              embedExplorationButtonService.showModal);

            $http({
              method: 'GET',
              url: '/explorationsummarieshandler/data',
              params: {
                stringified_exp_ids: JSON.stringify([explorationId])
              }
            }).success(function(data) {
              var expInfo = data.summaries[0];

              $scope.averageRating = ratingComputationService.computeAverageRating(
                expInfo.ratings) || 'Unrated';
              $scope.contributorNames = expInfo.contributor_names;
              $scope.explorationTags = getExplorationTagsSummary(expInfo.tags);
              $scope.explorationTitle = expInfo.title;
              $scope.infoCardBackgroundCss = {
                'background-color': expInfo.thumbnail_bg_color
              };
              $scope.infoCardBackgroundImageUrl = expInfo.thumbnail_icon_url;
              $scope.lastUpdatedString = getLastUpdatedString(
                expInfo.last_updated_msec);
              $scope.numViews = expInfo.num_views;
              $scope.objective = expInfo.objective;

              $scope.hasInfoCardLoaded = true;
            }).error(function(data) {
              $scope.hasInfoCardFailedToLoad = true;
            });

            $scope.cancel = function() {
              $modalInstance.dismiss();
            };
          }
        ]
      });
    };
  }
]);
