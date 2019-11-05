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

require('domain/user/UserInfoObjectFactory.ts');
require('services/contextual/url.service.ts');

/**
 * @fileoverview Service for user data.
 */

angular.module('oppia').factory('UserService', [
  '$http', '$q', '$window', 'UrlInterpolationService', 'UrlService',
  'UserInfoObjectFactory', 'DEFAULT_PROFILE_IMAGE_PATH',
  function($http, $q, $window, UrlInterpolationService, UrlService,
      UserInfoObjectFactory, DEFAULT_PROFILE_IMAGE_PATH) {
    var PREFERENCES_DATA_URL = '/preferenceshandler/data';

    var userInfo = null;

    var getUserInfoAsync = function() {
      if (UrlService.getPathname() === '/signup') {
        return $q.resolve(UserInfoObjectFactory.createDefault());
      }
      if (userInfo) {
        return $q.resolve(userInfo);
      }
      return $http.get(
        '/userinfohandler'
      ).then(function(response) {
        if (response.data.user_is_logged_in) {
          userInfo = UserInfoObjectFactory.createFromBackendDict(response.data);
          return $q.resolve(userInfo);
        } else {
          return $q.resolve(UserInfoObjectFactory.createDefault());
        }
      });
    };

    return {
      getProfileImageDataUrlAsync: function() {
        var profilePictureDataUrl = (
          UrlInterpolationService.getStaticImageUrl(
            DEFAULT_PROFILE_IMAGE_PATH));
        return getUserInfoAsync().then(function(userInfo) {
          if (userInfo.isLoggedIn()) {
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
        });
      },
      setProfileImageDataUrlAsync: function(newProfileImageDataUrl) {
        return $http.put(PREFERENCES_DATA_URL, {
          update_type: 'profile_picture_data_url',
          data: newProfileImageDataUrl
        });
      },
      getLoginUrlAsync: function() {
        var urlParameters = {
          current_url: $window.location.pathname
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
