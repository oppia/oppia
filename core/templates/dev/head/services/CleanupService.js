// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utility service that cleans up watchers when they are no
 *   longer needed.
 */

oppia.factory('CleanupService', [function() {
  return {
    registerOn: function(scope, eventName, callback) {
      var cleanup = scope.$on(eventName, callback);
      scope.$on('$destroy', cleanup);
    },
    registerWatch: function(scope, watchFn, callback, objectEquality) {
      var cleanup = scope.$watch(watchFn, callback, objectEquality);
      scope.$on('$destroy', cleanup);
    }
  };
}]);
