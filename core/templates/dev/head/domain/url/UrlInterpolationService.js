// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to construct URLs by inserting variables within them as
 * necessary to have a fully-qualified URL.
 *
 * @author henning.benmax@gmail.com (Ben Henning)
 */

oppia.factory('UrlInterpolationService', [function() {
  return {
    /**
     * Given a formatted URL, interpolates the URL by inserting values the URL
     * needs using the interpolationValues object. For example, formattedUrl
     * might be:
     *
     *   /createhandler/resolved_answers/<exploration_id>/<escaped_state_name>
     *
     * interpolationValues is an object whose keys are variables within the URL.
     * For the above example, interpolationValues may look something like:
     *
     *   { 'exploration_id': '0', 'escaped_state_name': 'InputBinaryNumber' }
     *
     * If a URL requires a value which is not keyed within the
     * interpolationValues object, it will return null.
     */
    interpolateUrl: function(formattedUrl, interpolationValues) {
      var pattern = /<(\w+)>/;
      var filledUrl = angular.copy(formattedUrl);
      var match = filledUrl.match(pattern);
      while (match) {
        var varName = match[1];
        if (!interpolationValues.hasOwnProperty(varName)) {
          return null;
        }
        filledUrl = filledUrl.replace(pattern, interpolationValues[varName]);
        match = filledUrl.match(pattern);
      }
      return filledUrl;
    }
  };
}]);
