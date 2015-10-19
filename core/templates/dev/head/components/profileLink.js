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
 * @fileoverview Directives for creating text and image links to a user's 
 * profile page.
 *
 * @author raine@stanford.edu (raine Hoover)
 */

oppia.directive('profileLinkText', [function() {
  return {
    restrict: 'E',
    scope: {
      linkedName: '@'
    },
    templateUrl: 'components/profileLinkText',
  };
}]);

oppia.directive('profileLinkImage', [function() { 
  return {
    restrict: 'E',
    scope: {
      linkedName: '@',
      classes: '@',
      alt: '@'
    },
    templateUrl: 'components/profileLinkImage',
    controller: ['$scope', '$http', '$q', function($scope, $http, $q) {
      $scope.profileImageURL = '/preferenceshandler/profile_picture_by_username/' + $scope.linkedName;
      var DEFAULT_PROFILE_IMAGE_PATH = '/images/avatar/user_blue_72px.png';
      $scope.linkedProfilePicture = DEFAULT_PROFILE_IMAGE_PATH;
      // Returns a promise for the user profile picture, or the default image if
      // user is not logged in or has not uploaded a profile picture, or the
      // player is in preview mode.
      function getUserProfileImage(profileImageURL) {
        var deferred = $q.defer();
        $http.get(profileImageURL).success(function(data) {
          var profilePictureDataUrl = data.profile_picture_data_url;
          if (profilePictureDataUrl) {
            deferred.resolve(profilePictureDataUrl);
          } else {
            deferred.resolve(DEFAULT_PROFILE_IMAGE_PATH);
          }
        });
        return deferred.promise;
      }
      getUserProfileImage($scope.profileImageURL).then(function(result) {
        $scope.linkedProfilePicture = result;
      });
    }]
  };
}]);
