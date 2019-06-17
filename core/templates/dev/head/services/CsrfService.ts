// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for managing csrf tokens
 */

oppia.factory('CsrfService', [function() {
  var token = null;
  return {
    fetchToken: function() {
      fetch('/csrf').then(function(response) {
        return response.text();
      }).then(function(response) {
        token = JSON.parse(response.substring(5)).token;
      });
    },

    // For Signup page
    setToken: function(csrfToken) {
      token = csrfToken;
    },

    getToken: function() {
      return token;
    }
  };
}]);
