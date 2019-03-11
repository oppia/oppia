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
  '$http', '$q', '$window', 'UrlInterpolationService', 'UserInfoObjectFactory',
  'DEFAULT_PROFILE_IMAGE_PATH',
  function($http, $q, $window, UrlInterpolationService, UserInfoObjectFactory,
      DEFAULT_PROFILE_IMAGE_PATH) {
    var PREFERENCES_DATA_URL = '/preferenceshandler/data';

    var userInfo = null;

    var getUserInfoAsync = function() {
      if (GLOBALS.userIsLoggedIn) {
        if (userInfo) {
          return $q.resolve(userInfo);
        }
        return $http.get(
          '/userinfohandler'
        ).then(function(response) {
          userInfo = UserInfoObjectFactory.createFromBackendDict(response.data);
          return userInfo;
        });
      } else {
        return $q.resolve(UserInfoObjectFactory.createDefault());
      }
    };

    return {
      getProfileImageDataUrlAsync: function() {
        var profilePictureDataUrl = (
          UrlInterpolationService.getStaticImageUrl(
            DEFAULT_PROFILE_IMAGE_PATH));

        if (GLOBALS.userIsLoggedIn) {
          return $http.get(
            '/preferenceshandler/profile_picture'
          ).then(function(response) {
            if (response.data.profile_picture_data_url) {
              profilePictureDataUrl = response.data.profile_picture_data_url;
            }
            return profilePictureDataUrl;
          });
        } else {
          return $q.resolve(profilePictureDataUrl);
        }
      },
      setProfileImageDataUrlAsync: function(newProfileImageDataUrl) {
        return $http.put(PREFERENCES_DATA_URL, {
          update_type: 'profile_picture_data_url',
          data: newProfileImageDataUrl
        });
      },
      getLoginUrlAsync: function() {
        var urlParameters = {
          current_url: $window.location.href
        };
        return $http.get('/url_handler', {params: urlParameters}).then(
          function(response) {
            return response.data.login_url;
          }
        );
      },
      getUserInfoAsync: getUserInfoAsync
    };
  }
]);
