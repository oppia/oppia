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
 * @fileoverview Service for manipulating the page URL. Also allows
 * functions on $window to be mocked in unit tests.
 */

oppia.factory('UrlService', ['$window', function($window) {
  return {
    getUrlParams: function() {
      var params = {};
      var parts = $window.location.href.replace(
        /[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
          params[key] = value;
        }
      );
      return params;
    },
    isIframed: function() {
      var pathname = this.getPathname();
      var urlParts = pathname.split('/');
      return urlParts[1] === 'embed';
    },
    getPathname: function() {
      return $window.location.pathname;
    },
    getHash: function() {
      return $window.location.hash;
    }
  };
}]);
