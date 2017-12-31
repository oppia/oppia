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

oppia.factory('UrlService', [
  '$window', '$location',
  function(
      $window, $location) {
    return {
      // This function is for testing purposes (to mock $window.location)
      getCurrentUrl: function() {
        return $window.location;
      },
      getUrlParams: function() {
        var params = {};
        var parts = this.getCurrentUrl().href.replace(
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
        return this.getCurrentUrl().pathname;
      },
      getParentExplorationIds: function() {
        if ($location.search().parent) {
          if ($location.search().parent.constructor === Array) {
            return $location.search().parent;
          } else if ($location.search().parent) {
          /* By default, single parent id gave a single string whereas, an array
             with  a single element is what is required, hence the additional
             condition */
            return [$location.search().parent];
          }
        } else {
          return null;
        }
      },
      /* parameterList is an array of exploration ids from which 1 is popped out
         and then, URL updated. */
      updateParameterList: function(parameterList) {
        var parameterString = '#?parent=';
        for (var i = 0; i < parameterList.length - 1; i++) {
          parameterString += parameterList[i] + '&';
        }
        return parameterString.slice(0, -1);
      },
      /* Use UrlService.pushParentIdToUrl(id); at the state which
         redirects to push current exploration id to url stack. */
      pushParentIdToUrl: function(explorationId) {
        $location.search({parent: explorationId});
      },
      getHash: function() {
        return this.getCurrentUrl().hash;
      }
    };
  }]);
