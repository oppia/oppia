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
  '$scope', '$http', '$rootScope', 'oppiaDatetimeFormatter',
  function($scope, $http, $rootScope, oppiaDatetimeFormatter) {
    var profileDataUrl = '/profilehandler/data/' + GLOBALS.PROFILE_USERNAME;
    var DEFAULT_PROFILE_PICTURE_URL = '/images/general/no_profile_picture.png';

    $scope.getLocaleDateString = function(millisSinceEpoch) {
      return oppiaDatetimeFormatter.getLocaleDateString(millisSinceEpoch);
    };

    $rootScope.loadingMessage = 'Loading';
    $http.get(profileDataUrl).success(function(data) {
      $rootScope.loadingMessage = '';
      $scope.userBio = data.user_bio;
      $scope.subjectInterests = data.subject_interests.join(", ");
      $scope.firstContributionMsec = data.first_contribution_msec;
      $scope.profilePictureDataUrl = (
        data.profile_picture_data_url || DEFAULT_PROFILE_PICTURE_URL);
      $rootScope.loadingMessage = '';
    });
  }
]);
