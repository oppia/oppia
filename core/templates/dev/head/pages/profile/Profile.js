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
 */

oppia.controller('Profile', [
  '$scope', '$http', '$rootScope', '$log', 'DateTimeFormatService',
  'UrlInterpolationService',
  function($scope, $http, $rootScope, $log, DateTimeFormatService,
      UrlInterpolationService) {
    var profileDataUrl = '/profilehandler/data/' + GLOBALS.PROFILE_USERNAME;
    var DEFAULT_PROFILE_PICTURE_URL = UrlInterpolationService.getStaticImageUrl(
      '/general/no_profile_picture.png');

    $scope.getLocaleDateString = function(millisSinceEpoch) {
      return DateTimeFormatService.getLocaleDateString(millisSinceEpoch);
    };

    $rootScope.loadingMessage = 'Loading';
    $http.get(profileDataUrl).then(function(response) {
      var data = response.data;
      $rootScope.loadingMessage = '';
      $scope.username = {
        title: 'Username',
        value: data.profile_username,
        helpText: (data.profile_username)
      };
      $scope.usernameIsLong = data.profile_username.length > 16;
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
        }
      );

      $scope.userNotLoggedIn = !data.username;

      $scope.isAlreadySubscribed = data.is_already_subscribed;
      $scope.isUserVisitingOwnProfile = data.is_user_visiting_own_profile;

      $scope.subscriptionButtonPopoverText = '';

      $scope.currentPageNumber = 0;
      $scope.PAGE_SIZE = 6;
      $scope.startingExplorationNumber = 1;
      $scope.endingExplorationNumber = 6;
      $scope.Math = window.Math;
      $scope.profileIsOfCurrentUser = data.profile_is_of_current_user;

      $scope.changeSubscriptionStatus = function() {
        if ($scope.userNotLoggedIn) {
          window.location.href = GLOBALS.loginUrl;
        } else {
          if (!$scope.isAlreadySubscribed) {
            $scope.isAlreadySubscribed = true;
            $http.post('/subscribehandler', {
              creator_username: data.profile_username
            });
          } else {
            $scope.isAlreadySubscribed = false;
            $http.post('/unsubscribehandler', {
              creator_username: data.profile_username
            });
          }
          $scope.updateSubscriptionButtonPopoverText();
        }
      };

      $scope.updateSubscriptionButtonPopoverText = function() {
        if ($scope.userNotLoggedIn) {
          $scope.subscriptionButtonPopoverText = (
            'Log in or sign up to subscribe to your favorite creators.');
        } else if ($scope.isAlreadySubscribed) {
          $scope.subscriptionButtonPopoverText = (
            'Unsubscribe to stop receiving email notifications regarding new ' +
            'explorations published by ' + $scope.username.value + '.');
        } else {
          $scope.subscriptionButtonPopoverText = (
            'Receive email notifications, whenever ' +
            $scope.username.value + ' publishes a new exploration.');
        }
      };
      $scope.updateSubscriptionButtonPopoverText();

      $scope.goToPreviousPage = function() {
        if ($scope.currentPageNumber === 0) {
          $log.error('Error: cannot decrement page');
        } else {
          $scope.currentPageNumber--;
        }
      };
      $scope.goToNextPage = function() {
        if ($scope.currentPageNumber * $scope.PAGE_SIZE >= (
            data.edited_exp_summary_dicts.length)) {
          $log.error('Error: Cannot increment page');
        } else {
          $scope.currentPageNumber++;
        }
      };

      $scope.getExplorationsToDisplay = function() {
        $scope.explorationsOnPage = [];
        if ($scope.userEditedExplorations.length === 0) {
          return $scope.explorationsOnPage;
        }
        $scope.explorationIndexStart = (
          $scope.currentPageNumber * $scope.PAGE_SIZE);
        $scope.explorationIndexEnd = (
          $scope.explorationIndexStart + $scope.PAGE_SIZE - 1);
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
