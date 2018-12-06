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
 * @fileoverview Service to grant read-only access to the admin config values of
 * Oppia. These values are hidden to users and help control how Oppia functions.
 */

oppia.constant('ADMIN_CONFIG_URL', '/adminconfig');

oppia.factory('AdminConfigService', [
  '$http', 'UrlInterpolationService', 'ADMIN_CONFIG_URL',
  function($http, UrlInterpolationService, ADMIN_CONFIG_URL) {
    var configData = {};

    return {
      init: function() {
        return $http.get(ADMIN_CONFIG_URL).then(function(response) {
          configData = response.data;
        });
      },
      getConfigValue: function(configName, defaultValue) {
        return configData.hasOwnProperty(configName) ?
          configData[configName] : defaultValue;
      },
    };
  }]);
