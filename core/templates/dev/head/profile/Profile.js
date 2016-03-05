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
 * @fileoverview Data and controllers for the Oppia profile page.
 *
 * @author sean@seanlip.org (Sean Lip)
 */

oppia.controller('Profile', [
  '$scope', '$filter', '$http', '$rootScope', 'oppiaDatetimeFormatter',
  function($scope, $filter, $http, $rootScope, oppiaDatetimeFormatter) {
    var profileDataUrl = '/profilehandler/data/' + GLOBALS.PROFILE_USERNAME;
    var DEFAULT_PROFILE_PICTURE_URL = '/images/general/no_profile_picture.png';

    $scope.getLocaleDateString = function(millisSinceEpoch) {
      return oppiaDatetimeFormatter.getLocaleDateString(millisSinceEpoch);
    };

    $rootScope.loadingMessage = 'Loading';
    $http.get(profileDataUrl).success(function(data) {
      $rootScope.loadingMessage = '';
      $scope.username = {
        title: 'Username',
        value: data.username,
        helpText: (data.username)
      };
      $scope.userBio = data.user_bio;
      $scope.userDisplayedStatistics = [{
        title: 'Impact',
        value: data.user_impact_score,
        helpText: (
          'A rough measure of the impact of explorations created by this ' +
          'user. Better ratings and more playthroughs improve this score.')
      }, {
        title: 'Created',
        value: data.created_exp_summary_dicts.length
      }, {
        title: 'Edited',
        value: data.edited_exp_summary_dicts.length
      }];

      $scope.userEditedExplorations = data.edited_exp_summary_dicts.sort(
          function(exploration1, exploration2) {
        if (exploration1.ratings > exploration2.ratings) {
          return 1;
        } else if (exploration1.ratings === exploration2.ratings) {
          if (exploration1.playthroughs > exploration2.playthroughs) {
            return 1;
          } else {
            return -1;
          }
        } else {
          return -1;
        }
      });

      $scope.currentPage = 0;
      $scope.previousPage = function() {
        $scope.currentPage--;
      };
      $scope.nextPage = function() {
        $scope.currentPage++;
      };
      $scope.pageSize = 6;

      $scope.userDisplayedExplorations = function() {
        $scope.explorationsOnPage = [];
        $scope.explorationIndexStart = $scope.currentPage * $scope.pageSize;
        $scope.explorationIndexEnd = (
          $scope.explorationIndexStart + $scope.pageSize - 1);
        for (var count = $scope.explorationIndexStart;
            count <= $scope.explorationIndexEnd; count++) {
          var nextExploration = $scope.userEditedExplorations[count];
          if (nextExploration == null) break;
          $scope.explorationsOnPage.push($scope.userEditedExplorations[count]);
        }
        return $scope.explorationsOnPage;
      };

      $scope.startingExplorationNumber = '1';
      $scope.endingExplorationNumber = '6';
      $scope.newExplorationNumbers = function() {
        var startingNumber = $scope.currentPage * $scope.pageSize + 1;
        $scope.startingExplorationNumber = startingNumber.toString();
        if ($scope.userEditedExplorations.length > (
            $scope.currentPage+1) * $scope.pageSize) {
          var endingNumber = $scope.currentPage * $scope.pageSize + 6;
          $scope.endingExplorationNumber = endingNumber;
        }
        else {
          var endingNumber = $scope.userEditedExplorations.length;
          $scope.endingExplorationNumber = endingNumber;
        }
      };

      $scope.numUserPortfolioExplorations = (
        data.edited_exp_summary_dicts.length);
      $scope.subjectInterests = data.subject_interests;
      $scope.firstContributionMsec = data.first_contribution_msec;
      $scope.profilePictureDataUrl = (
        data.profile_picture_data_url || DEFAULT_PROFILE_PICTURE_URL);
      $rootScope.loadingMessage = '';
    });
  }
]);
