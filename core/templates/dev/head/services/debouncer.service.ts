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
 * @fileoverview Service for debouncing function calls.
 */

angular.module('oppia').factory('DebouncerService', [function() {
  return {
    // Returns a function that will not be triggered as long as it continues to
    // be invoked. The function only gets executed after it stops being called
    // for `wait` milliseconds.
    debounce: function(func, millisecsToWait) {
      var timeout;
      var context = this;
      var args = arguments;
      var timestamp;
      var result;

      var later = function() {
        var last = new Date().getTime() - timestamp;
        if (last < millisecsToWait) {
          timeout = setTimeout(later, millisecsToWait - last);
        } else {
          timeout = null;
          result = func.apply(context, args);
          if (!timeout) {
            context = null;
            args = null;
          }
        }
      };

      return function() {
        context = this;
        args = arguments;
        timestamp = new Date().getTime();
        if (!timeout) {
          timeout = setTimeout(later, millisecsToWait);
        }
        return result;
      };
    }
  };
}]);
