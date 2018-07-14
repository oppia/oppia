// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for user data.
 */

oppia.factory('UserService', [
  '$http', '$q', 'UrlInterpolationService',
  function($http, $q, UrlInterpolationService) {
    var _isLoggedIn = GLOBALS.userIsLoggedIn;
    var DEFAULT_PROFILE_IMAGE_PATH = (
      UrlInterpolationService.getStaticImageUrl(
        '/avatar/user_blue_72px.png'));

    return {
      getProfileImageDataUrl: function() {
        if (_isLoggedIn) {
          return $http.get(
            '/preferenceshandler/profile_picture'
          ).then(function(response) {
            var profilePictureDataUrl = response.data.profile_picture_data_url;
            return (
              profilePictureDataUrl ? profilePictureDataUrl :
              DEFAULT_PROFILE_IMAGE_PATH);
          });
        } else {
          return $q.resolve(DEFAULT_PROFILE_IMAGE_PATH);
        }
      }
    };
  }
]);
