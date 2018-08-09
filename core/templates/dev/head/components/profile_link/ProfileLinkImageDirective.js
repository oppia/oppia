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
 * @fileoverview Directive for creating image links to a user's profile page.
 */

oppia.directive('profileLinkImage', [
  'UrlInterpolationService', 'SYSTEM_USER_IDS',
  function(UrlInterpolationService, SYSTEM_USER_IDS) {
    return {
      restrict: 'E',
      scope: {
        username: '&'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/profile_link/' +
        'profile_link_image_directive.html'),
      controller: [
        '$scope', '$http',
        function($scope, $http) {
          var DEFAULT_PROFILE_IMAGE_PATH = (
            UrlInterpolationService.getStaticImageUrl(
              '/avatar/user_blue_72px.png'));

          $scope.isUsernameLinkable = function(username) {
            return SYSTEM_USER_IDS.indexOf(username) === -1;
          };

          $scope.profileImageUrl = (
            '/preferenceshandler/profile_picture_by_username/' +
            $scope.username());
          $scope.profilePicture = DEFAULT_PROFILE_IMAGE_PATH;
          // Returns a promise for the user profile picture, or the default
          // image if user is not logged in or has not uploaded a profile
          // picture, or the player is in preview mode.
          $http.get($scope.profileImageUrl).then(function(response) {
            $scope.profilePicture = (
              response.data.profile_picture_data_url_for_username ||
              DEFAULT_PROFILE_IMAGE_PATH);
          });
        }]
    };
  }]);
