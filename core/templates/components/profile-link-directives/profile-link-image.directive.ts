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

require('domain/utilities/url-interpolation.service.ts');

angular.module('oppia').directive('profileLinkImage', [
  'UrlInterpolationService', 'SYSTEM_USER_IDS',
  function(UrlInterpolationService, SYSTEM_USER_IDS) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        username: '&'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/profile-link-directives/' +
        'profile-link-image.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$http',
        function($http) {
          var ctrl = this;
          var DEFAULT_PROFILE_IMAGE_PATH = (
            UrlInterpolationService.getStaticImageUrl(
              '/avatar/user_blue_72px.webp'));
          ctrl.isUsernameLinkable = function(username) {
            return SYSTEM_USER_IDS.indexOf(username) === -1;
          };
          ctrl.$onInit = function() {
            ctrl.profileImageUrl = (
              '/preferenceshandler/profile_picture_by_username/' +
              ctrl.username());
            ctrl.profilePicture = DEFAULT_PROFILE_IMAGE_PATH;

            // Returns a promise for the user profile picture, or the default
            // image if user is not logged in or has not uploaded a profile
            // picture, or the player is in preview mode.
            $http.get(ctrl.profileImageUrl).then(function(response) {
              ctrl.profilePicture = (
                response.data.profile_picture_data_url_for_username ||
                DEFAULT_PROFILE_IMAGE_PATH);
            });
          };
        }
      ]
    };
  }]);
