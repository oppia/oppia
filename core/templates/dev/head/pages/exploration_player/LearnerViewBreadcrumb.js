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
 * @fileoverview Controllers for the learner view breadcrumb section of the
 * navbar.
 */

oppia.controller('LearnerViewBreadcrumb', [
  '$scope', '$modal', '$http', '$log', 'explorationContextService',
  'EXPLORATION_SUMMARY_DATA_URL_TEMPLATE',
  function($scope, $modal, $http, $log, explorationContextService,
    EXPLORATION_SUMMARY_DATA_URL_TEMPLATE) {
    var explorationId = explorationContextService.getExplorationId();
    var expInfo = null;

    $scope.showInformationCard = function() {
      if (expInfo) {
        openInformationCardModal();
      } else {
        $http.get(EXPLORATION_SUMMARY_DATA_URL_TEMPLATE, {
          params: {
            stringified_exp_ids: JSON.stringify([explorationId])
          }
        }).then(function(response) {
          expInfo = response.data.summaries[0];
          openInformationCardModal();
        }, function() {
          $log.error(
            'Information card failed to load for exploration ' + explorationId);
        });
      }
    };

    var openInformationCardModal = function() {
      $modal.open({
        animation: true,
        templateUrl: 'modal/informationCard',
        windowClass: 'oppia-modal-information-card',
        resolve: {
          expInfo: function() {
            return expInfo;
          }
        },
        controller: [
          '$scope', '$window', '$modalInstance', 'oppiaDatetimeFormatter',
          'RatingComputationService', 'expInfo',
          function($scope, $window, $modalInstance, oppiaDatetimeFormatter,
                   RatingComputationService, expInfo) {
            var getExplorationTagsSummary = function(arrayOfTags) {
              var tagsToShow = [];
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
              }

              return {
                tagsToShow: tagsToShow,
                tagsInTooltip: tagsInTooltip
              };
            };

            var getLastUpdatedString = function(millisSinceEpoch) {
              return oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString(
                millisSinceEpoch);
            };

            $scope.DEFAULT_TWITTER_SHARE_MESSAGE_PLAYER = (
              GLOBALS.DEFAULT_TWITTER_SHARE_MESSAGE_PLAYER);
            $scope.averageRating = (
              RatingComputationService.computeAverageRating(expInfo.ratings));
            var contributorsSummary = (
              expInfo.human_readable_contributors_summary || {});
            $scope.contributorNames = Object.keys(contributorsSummary).sort(
              function(contributorUsername1, contributorUsername2) {
                var commitsOfContributor1 = contributorsSummary[
                  contributorUsername1].num_commits;
                var commitsOfContributor2 = contributorsSummary[
                  contributorUsername2].num_commits;
                return commitsOfContributor2 - commitsOfContributor1;
              }
            );
            $scope.explorationId = expInfo.id;
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

            $scope.cancel = function() {
              $modalInstance.dismiss();
            };
          }
        ]
      });
    };
  }
]);
