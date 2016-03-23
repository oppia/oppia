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
          } else if (exploration1.playthroughs > exploration2.playthroughs) {
            return 0;
          } else {
            return -1;
          }
        } else {
          return -1;
        }
      });

      $scope.currentPageNumber = 0;
      $scope.pageSize = 6;
      $scope.startingExplorationNumber = 1;
      $scope.endingExplorationNumber = 6;
      $scope.updateDisplayedExplorationNumbers = function() {
        var startingNumber = $scope.currentPageNumber * $scope.pageSize + 1;
        $scope.startingExplorationNumber = startingNumber;
        if ($scope.userEditedExplorations.length > (
            $scope.currentPageNumber + 1) * $scope.pageSize) {
          var endingNumber = $scope.currentPageNumber * $scope.pageSize + 6;
          $scope.endingExplorationNumber = endingNumber;
        } else {
          var endingNumber = $scope.userEditedExplorations.length;
          $scope.endingExplorationNumber = endingNumber;
        }
      };

      $scope.goToPreviousPage = function() {
        if ($scope.currentPageNumber === 0) {
          console.log('Error: cannot decrement page');
        } else {
          $scope.currentPageNumber--;
          $scope.updateDisplayedExplorationNumbers();
        }
      };
      $scope.goToNextPage = function() {
        if ($scope.currentPageNumber * $scope.pageSize >= (
            data.edited_exp_summary_dicts.length)) {
          console.log('Error: Cannot increment page');
        } else {
          $scope.currentPageNumber++;
          $scope.updateDisplayedExplorationNumbers();
        }
      };

      $scope.getExplorationsToDisplay = function() {
        $scope.explorationsOnPage = [];
        $scope.explorationIndexStart = (
          $scope.currentPageNumber * $scope.pageSize);
        $scope.explorationIndexEnd = (
          $scope.explorationIndexStart + $scope.pageSize - 1);
        for (var ind = $scope.explorationIndexStart;
            ind <= $scope.explorationIndexEnd; ind++) {
          $scope.explorationsOnPage.push($scope.userEditedExplorations[ind]);
          if (ind === $scope.userEditedExplorations.length - 1) {
            break;
          }
        }
        return $scope.explorationsOnPage;
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
