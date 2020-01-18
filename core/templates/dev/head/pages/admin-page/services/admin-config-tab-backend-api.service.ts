// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to retrieve information of review tests from the
 * backend.
 */

require('pages/admin-page/admin-page.constants.ajs.ts');

angular.module('oppia').factory('AdminConfigTabBackendApiService', [
  '$http', 'ADMIN_HANDLER_URL',
  function($http, ADMIN_HANDLER_URL) {
    var _revertConfigProperty = function(data) {
      return $http.post(ADMIN_HANDLER_URL, data);
    };

    var _saveConfigProperties = function(data) {
      return $http.post(ADMIN_HANDLER_URL, data);
    };

    return {
      revertConfigProperty: _revertConfigProperty,
      saveConfigProperties: _saveConfigProperties,
    };
  }
]);
